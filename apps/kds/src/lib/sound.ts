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
    { name: 'totem.kds.sound' },
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

const playTone = (freq: number, durationMs: number, startOffsetMs = 0, volume = 0.2): void => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  const start = ac.currentTime + startOffsetMs / 1000;
  const end = start + durationMs / 1000;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(end + 0.02);
};

export const playNewOrderChime = (): void => {
  if (!useSoundStore.getState().enabled) return;
  // tap-tap rápido — 1000Hz duas vezes curtas
  playTone(1000, 80, 0);
  playTone(1000, 80, 100);
};

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

export const primeAudio = (): void => {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') void ac.resume();
};
