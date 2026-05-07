'use client';

import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SoundState = {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (v: boolean) => void;
};

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      enabled: true,
      toggle: () => set((s) => ({ enabled: !s.enabled })),
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: 'totem.waiter.sound' },
  ),
);

let ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (ctx && ctx.state !== 'closed') return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
};

const playTone = (freq: number, durationMs: number, startOffsetMs = 0, volume = 0.18): void => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const start = ac.currentTime + startOffsetMs / 1000;
  const end = start + durationMs / 1000;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(end + 0.02);
};

export const playWaiterCallChime = (): void => {
  if (!useSoundStore.getState().enabled) return;
  // ding-dong: 880Hz then 660Hz
  playTone(880, 180, 0);
  playTone(660, 240, 200);
};

/**
 * Toca som quando `tick` muda. Ignora o primeiro render (pra não tocar
 * ao montar com snapshot inicial).
 */
export const useSoundOnTick = (tick: number, play: () => void): void => {
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (last.current === null) {
      last.current = tick;
      return;
    }
    if (tick !== last.current) {
      last.current = tick;
      play();
    }
  }, [tick, play]);
};

/**
 * Desbloqueia AudioContext em mobile/Safari — chamar em onClick/onTouchStart.
 * Sem isso, navegadores recusam tocar sem interação prévia.
 */
export const primeAudio = (): void => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
};
