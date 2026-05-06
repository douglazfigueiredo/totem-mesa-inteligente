export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDeltaBRL = (cents: number): string => {
  if (cents === 0) return '';
  const sign = cents > 0 ? '+' : '−';
  return `${sign} ${formatBRL(Math.abs(cents))}`;
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
