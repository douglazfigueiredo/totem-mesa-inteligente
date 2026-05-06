export type Clock = { now: () => number };

export const systemClock: Clock = { now: () => Date.now() };

export const fixedClock = (initial: number): Clock & { advance: (ms: number) => void } => {
  let t = initial;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
};
