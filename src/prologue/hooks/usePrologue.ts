import { useCallback, useReducer } from 'react';
import { initialPrologueState, prologueReducer, type PrologueAction } from '../state/prologueMachine';
import { prologueStorage } from '../state/storage';
import type { ExplorerProfile } from '../state/types';

/** Puente React ↔ máquina de estados pura + persistencia local. */
export function usePrologue() {
  const [state, dispatch] = useReducer(prologueReducer, initialPrologueState);
  const send = useCallback((a: PrologueAction) => dispatch(a), []);
  const complete = useCallback((): ExplorerProfile | null => {
    if (!state.ageGroup) return null;
    const profile: ExplorerProfile = { ageGroup: state.ageGroup, interests: state.interests, createdAt: new Date().toISOString() };
    prologueStorage.markSeen(profile);
    return profile;
  }, [state.ageGroup, state.interests]);
  return { state, send, complete };
}
