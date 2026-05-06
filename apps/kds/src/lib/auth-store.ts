'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthState = {
  apiKey: string | null;
  deviceId: string | null;
  tenantId: string | null;
  deviceNome: string | null;
  pairedAt: number | null;

  employeeId: string | null;
  employeeNome: string | null;
  employeeRoles: string[] | null;
  loggedAt: number | null;

  setPaired: (input: {
    apiKey: string;
    deviceId: string;
    tenantId: string;
    deviceNome: string;
  }) => void;
  setEmployee: (input: { id: string; nome: string; roles: string[] }) => void;
  logoutEmployee: () => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: null,
      deviceId: null,
      tenantId: null,
      deviceNome: null,
      pairedAt: null,
      employeeId: null,
      employeeNome: null,
      employeeRoles: null,
      loggedAt: null,
      setPaired: ({ apiKey, deviceId, tenantId, deviceNome }) =>
        set({
          apiKey,
          deviceId,
          tenantId,
          deviceNome,
          pairedAt: Date.now(),
        }),
      setEmployee: ({ id, nome, roles }) =>
        set({ employeeId: id, employeeNome: nome, employeeRoles: roles, loggedAt: Date.now() }),
      logoutEmployee: () =>
        set({ employeeId: null, employeeNome: null, employeeRoles: null, loggedAt: null }),
      clear: () =>
        set({
          apiKey: null,
          deviceId: null,
          tenantId: null,
          deviceNome: null,
          pairedAt: null,
          employeeId: null,
          employeeNome: null,
          employeeRoles: null,
          loggedAt: null,
        }),
    }),
    { name: 'tm-kds-auth', version: 1 },
  ),
);

export const isPaired = (s: AuthState): boolean => Boolean(s.apiKey);
export const isLoggedIn = (s: AuthState): boolean => Boolean(s.apiKey && s.employeeId);
