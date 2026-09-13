import { supabase, supabaseEnabled } from './supabaseClient';

export function onAuthChange(callback) {
  if (!supabaseEnabled) return () => {};
  supabase.auth.getSession().then(({ data }) => callback(data.session));
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => sub.subscription.unsubscribe();
}

export async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  return { error };
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
  });
  return { error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getBestTimes(userId) {
  const { data, error } = await supabase
    .from('best_times')
    .select('mode, best_seconds')
    .eq('user_id', userId);
  if (error) return {};
  return Object.fromEntries(data.map(row => [row.mode, row.best_seconds]));
}

export async function reportBestTime(userId, mode, seconds) {
  const { data: existing, error: selectError } = await supabase
    .from('best_times')
    .select('best_seconds')
    .eq('user_id', userId)
    .eq('mode', mode)
    .maybeSingle();
  if (selectError) console.error('reportBestTime: failed to read existing best time', selectError);

  if (existing && existing.best_seconds <= seconds) return { improved: false };

  const { error: upsertError } = await supabase
    .from('best_times')
    .upsert({ user_id: userId, mode, best_seconds: seconds, updated_at: new Date().toISOString() });
  if (upsertError) {
    console.error('reportBestTime: failed to save best time', upsertError);
    return { improved: false, error: upsertError };
  }
  return { improved: true };
}

export async function saveProgress(userId, { mode, puzzle, trayPieces, placedPieces, elapsedSeconds }) {
  const { error } = await supabase.from('game_progress').upsert({
    user_id: userId,
    mode,
    puzzle,
    tray_pieces: trayPieces,
    placed_pieces: placedPieces,
    elapsed_seconds: elapsedSeconds,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('saveProgress: failed to save progress', error);
}

export async function loadProgress(userId) {
  const { data, error } = await supabase
    .from('game_progress')
    .select('mode, puzzle, tray_pieces, placed_pieces, elapsed_seconds, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    mode: data.mode,
    puzzle: data.puzzle,
    trayPieces: data.tray_pieces,
    placedPieces: data.placed_pieces,
    elapsedSeconds: data.elapsed_seconds,
    updatedAt: data.updated_at,
  };
}

export async function clearBestTimes(userId) {
  const { error } = await supabase.from('best_times').delete().eq('user_id', userId);
  if (error) console.error('clearBestTimes: failed to clear best times', error);
  return { error };
}

export async function clearProgress(userId) {
  const { error } = await supabase.from('game_progress').delete().eq('user_id', userId);
  if (error) console.error('clearProgress: failed to clear progress', error);
}
