import 'server-only';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

const BCRYPT_ROUNDS = 10;

/**
 * Gera PIN aleatório de 4 dígitos com `randomInt` (CSPRNG do Node).
 * Permite zeros à esquerda. Probabilidade de colisão por loja é alta com
 * 4 dígitos (10k espaço), então o caller deve preferir regerar quando
 * houver conflito real ao invés de garantir unicidade aqui.
 */
export const generatePin = (): string => {
  const n = randomInt(0, 10_000);
  return String(n).padStart(4, '0');
};

export const hashPin = (pin: string): string => bcrypt.hashSync(pin, BCRYPT_ROUNDS);

export const verifyPin = (pin: string, hash: string): boolean => bcrypt.compareSync(pin, hash);
