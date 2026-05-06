import type { Server as SocketIOServer } from 'socket.io';
import type { WSEvent } from '@app/schemas';

export interface Broadcaster {
  broadcast(event: WSEvent): void;
  close(): Promise<void>;
}

export const makeMemoryBroadcaster = (): Broadcaster & { events: WSEvent[] } => {
  const events: WSEvent[] = [];
  return {
    events,
    broadcast: (event) => {
      events.push(event);
    },
    close: async () => {
      events.length = 0;
    },
  };
};

export const makeSocketBroadcaster = (io: SocketIOServer): Broadcaster => ({
  broadcast: (event) => {
    io.to(`tenant:${event.tenantId}`).emit('event', event);
  },
  close: () =>
    new Promise<void>((resolve) => {
      io.close(() => resolve());
    }),
});
