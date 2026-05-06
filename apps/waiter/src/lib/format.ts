export const formatAge = (sinceMs: number, nowMs = Date.now()): string => {
  const sec = Math.max(0, Math.floor((nowMs - sinceMs) / 1000));
  if (sec < 60) return `há ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min}m`;
  const h = Math.floor(min / 60);
  return `há ${h}h${(min % 60).toString().padStart(2, '0')}`;
};

export const reasonLabel = (reason: string): string => {
  switch (reason) {
    case 'talheres':
      return 'pediu talheres';
    case 'agua':
      return 'pediu água';
    case 'ajuda_pedido':
      return 'precisa de ajuda';
    case 'fechar_conta':
      return 'quer fechar a conta';
    case 'outros':
      return 'chamou';
    default:
      return reason;
  }
};
