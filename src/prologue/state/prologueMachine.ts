import type { AgeGroup, InterestId, PrologueState } from './types';
import { MAX_INTERESTS } from './catalog';

export type PrologueAction =
  | { type: 'CROSS_HORIZON' }
  | { type: 'APPROACH_DONE' }
  | { type: 'LOGO_DONE' }
  | { type: 'ANSWER_SIGNAL' }
  | { type: 'SKIP' }
  | { type: 'PREVIEW_GROUP'; group: AgeGroup | null }
  | { type: 'CHOOSE_GROUP'; group: AgeGroup }
  | { type: 'TOGGLE_INTEREST'; id: InterestId }
  | { type: 'BACK' }
  | { type: 'CONFIRM' }
  | { type: 'TRANSFORM_DONE' }
  | { type: 'RESTART' };

export const initialPrologueState: PrologueState = {
  phase: 'horizon',
  previewGroup: null,
  ageGroup: null,
  interests: [],
  skipped: false,
};

/** Máquina de estados pura: fácil de testear y de mover a Zustand/Redux si el repo principal lo usa. */
export function prologueReducer(state: PrologueState, action: PrologueAction): PrologueState {
  switch (action.type) {
    case 'CROSS_HORIZON':
      return state.phase === 'horizon' ? { ...state, phase: 'approach' } : state;
    case 'APPROACH_DONE':
      return state.phase === 'approach' ? { ...state, phase: 'logo' } : state;
    case 'LOGO_DONE':
      return state.phase === 'logo' ? { ...state, phase: 'contact' } : state;
    case 'ANSWER_SIGNAL':
      return state.phase === 'contact' ? { ...state, phase: 'identity' } : state;
    case 'SKIP':
      return { ...state, phase: 'identity', skipped: true };
    case 'PREVIEW_GROUP':
      return { ...state, previewGroup: action.group };
    case 'CHOOSE_GROUP':
      return { ...state, ageGroup: action.group, previewGroup: action.group, phase: 'interests' };
    case 'TOGGLE_INTEREST': {
      const has = state.interests.includes(action.id);
      if (has) return { ...state, interests: state.interests.filter((i) => i !== action.id) };
      if (state.interests.length >= MAX_INTERESTS) return state;
      return { ...state, interests: [...state.interests, action.id] };
    }
    case 'BACK':
      if (state.phase === 'interests') return { ...state, phase: 'identity' };
      return state;
    case 'CONFIRM':
      return state.phase === 'interests' && state.ageGroup && state.interests.length > 0
        ? { ...state, phase: 'transform' }
        : state;
    case 'TRANSFORM_DONE':
      return state.phase === 'transform' ? { ...state, phase: 'done' } : state;
    case 'RESTART':
      return initialPrologueState;
    default:
      return state;
  }
}
