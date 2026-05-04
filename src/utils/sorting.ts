import type { MediaRow } from '../types/media';

export const sortByPlayCount = (
  songId1: string,
  songId2: string,
  rows: { [key: string]: MediaRow }
) => {
  const song1 = rows[songId1];
  const song2 = rows[songId2];

  if (!song1 || !song2) return 0;
  
  const playCount1 = song1.playCount || 0;
  const playCount2 = song2.playCount || 0;

  if (playCount1 < playCount2) return 1;
  if (playCount1 > playCount2) return -1;

  return 0;
}; 