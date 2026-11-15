import { getSupabase } from './client';

export interface RemoteRow {
  nickname: string;
  stars: number;
  missions: number;
}

/** Ranking global real (RPC `leaderboard`, legible por anon). null = backend apagado o error → se usa la demo. */
export async function fetchLeaderboard(): Promise<RemoteRow[] | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.rpc('leaderboard');
    if (error || !Array.isArray(data)) return null;
    return (data as RemoteRow[]).filter((r) => typeof r.nickname === 'string').map((r) => ({ nickname: r.nickname, stars: Number(r.stars) || 0, missions: Number(r.missions) || 0 }));
  } catch {
    return null;
  }
}
