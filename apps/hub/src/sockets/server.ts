import type { Server as HTTPServer } from 'node:http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Repos } from '../repositories/index.js';
import type { DeviceRow } from '../repositories/device.repo.js';
import { WSEvent, type EventId, type TableId } from '@app/schemas';

type LoggerLike = {
  info: (obj: object, msg?: string) => void;
  debug: (obj: object, msg?: string) => void;
};

const ROOM_TENANT = (id: string) => `tenant:${id}`;
const ROOM_TABLE = (id: string) => `table:${id}`;
const ROOM_ROLE = (role: string) => `role:${role}`;

export type SocketData = {
  device: DeviceRow;
};

export type CreateSocketServerOptions = {
  httpServer: HTTPServer;
  repos: Repos;
  logger?: LoggerLike;
};

export const createSocketServer = (opts: CreateSocketServerOptions): SocketIOServer => {
  const { httpServer, repos, logger } = opts;

  const io = new SocketIOServer<
    Record<string, never>,
    Record<string, never>,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: { origin: true },
    serveClient: false,
    pingInterval: 15_000,
    pingTimeout: 60_000,
  });

  io.use((socket, next) => {
    const apiKey = extractApiKey(socket);
    if (!apiKey) {
      return next(new Error('missing api key'));
    }
    const device = repos.devices.findByApiKey(apiKey);
    if (!device) {
      return next(new Error('invalid api key'));
    }
    socket.data.device = device;
    repos.devices.updateLastSeen(device.id);
    next();
  });

  io.on('connection', (socket) => {
    const device = socket.data.device;
    socket.join(ROOM_TENANT(device.tenantId));
    socket.join(ROOM_ROLE(device.role));
    if (device.tableId) {
      socket.join(ROOM_TABLE(device.tableId));
    }

    logger?.info(
      { deviceId: device.id, role: device.role, tableId: device.tableId },
      'socket connected',
    );

    socket.on('disconnect', (reason) => {
      logger?.debug({ deviceId: device.id, reason }, 'socket disconnected');
    });

    socket.on('state:sync', (raw, ack: (snapshot: unknown) => void) => {
      try {
        const tableId = (raw && typeof raw === 'object' && 'tableId' in raw
          ? (raw as { tableId: string }).tableId
          : device.tableId) as TableId | undefined;
        if (!tableId) {
          ack({ error: 'tableId required for state:sync' });
          return;
        }
        const activeOrders = repos.orders.listActiveByTable(tableId);
        const activePreparos = activeOrders
          .map((o) => repos.preparos.getByOrderId(o.id))
          .filter((p): p is NonNullable<typeof p> => p !== null);
        const pendingWaiterCalls = repos.waiter
          .listPending(device.tenantId)
          .filter((c) => c.tableId === tableId);

        ack({
          tableId,
          serverTime: Date.now(),
          activeOrders,
          activePreparos,
          pendingWaiterCalls,
        });
      } catch (err) {
        ack({ error: (err as Error).message });
      }
    });

    socket.on('heartbeat', (raw, ack: (response: unknown) => void) => {
      const clientTime =
        raw && typeof raw === 'object' && 'clientTime' in raw
          ? Number((raw as { clientTime: number }).clientTime)
          : undefined;
      const serverTime = Date.now();
      repos.devices.updateLastSeen(device.id);
      ack({
        deviceId: device.id,
        serverTime,
        driftMs: clientTime !== undefined ? serverTime - clientTime : null,
      });
    });

    socket.on('event', (raw, ack: (response: unknown) => void) => {
      try {
        const event = WSEvent.parse(raw);
        if (event.tenantId !== device.tenantId) {
          ack({ error: 'tenant mismatch' });
          return;
        }
        if (repos.idempotency.has(event.eventId as EventId)) {
          ack({ ok: true, replay: true });
          return;
        }
        repos.idempotency.record({
          eventId: event.eventId,
          type: event.type,
          deviceId: device.id,
        });
        ack({ ok: true });
      } catch (err) {
        ack({ error: (err as Error).message });
      }
    });
  });

  return io;
};

const extractApiKey = (socket: Socket): string | null => {
  const auth = (socket.handshake.auth ?? {}) as Record<string, unknown>;
  if (typeof auth['apiKey'] === 'string') return auth['apiKey'] as string;
  const header = socket.handshake.headers['x-device-api-key'];
  if (typeof header === 'string') return header;
  if (Array.isArray(header) && header[0]) return header[0];
  return null;
};
