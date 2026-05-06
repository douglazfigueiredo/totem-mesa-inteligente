export const formatTime = (totalSec: number): string => {
  const sign = totalSec < 0 ? '-' : '';
  const abs = Math.abs(Math.floor(totalSec));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
};

export const formatElapsed = (sinceMs: number, nowMs = Date.now()): string =>
  formatTime(Math.max(0, Math.floor((nowMs - sinceMs) / 1000)));
