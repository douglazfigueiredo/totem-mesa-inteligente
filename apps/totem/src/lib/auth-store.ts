'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthState = {
  apiKey: string | null;
  deviceId: string | null;
  tenantId: string | null;
  tableId: string | null;
  tableNumero: number | null;
  pairedAt: number | null;

  setPaired: (input: {
    apiKey: string;
    deviceId: string;
    tenantId: string;
    tableId: string;
    tableNumero: number;
  }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null,
      deviceId: null,
      tenantId: null,
      tableId: null,
      tableNumero: null,
      pairedAt: null,
      setPaired: ({ apiKey, deviceId, tenantId, tableId, tableNumero }) =>
        set({
          apiKey,
          deviceId,
          tenantId,
          tableId,
          tableNumero,
          pairedAt: Date.now(),
        }),
      clear: () =>
        set({
          apiKey: null,
          deviceId: null,
          tenantId: null,
          tableId: null,
          tableNumero: null,
          pairedAt: null,
        }),
    }),
    {
      name: 'tm-totem-auth',
      version: 1,
    },
  ),
);

export const isPaired = (s: AuthState): boolean => Boolean(s.apiKey && s.tableId);
