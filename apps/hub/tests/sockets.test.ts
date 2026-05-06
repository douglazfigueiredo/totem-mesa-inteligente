import { createServer, type Server as HTTPServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import { createSocketServer } from '../src/sockets/server.js';
import { setupTestDB, type TestDB } from './setup.js';
import { generateApiKey } from '../src/repositories/device.repo.js';
import { makeSocketBroadcaster } from '../src/lib/broadcaster.js';
import { newEventId } from '../src/lib/ids.js';
import { newOrderItemId } from '../src/lib/ids.js';
import { ProductId, type DeviceRole, type TableId } from '@app/schemas';
import { randomUUID } from 'node:crypto';

let ctx: TestDB;
let httpServer: HTTPServer;
let port: number;
let io: ReturnType<typeof createSocketServer>;
let clients: ClientSocket[] = [];

const startServer = async () => {
  httpServer = createServer();
  io = createSocketServer({ httpServer, repos: ctx.repos });
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = httpServer.address();
  if (!addr || typeof addr === 'string') throw new Error('no port');
  port = addr.port;
};

const pairDevice = (role: DeviceRole, tableId?: TableId) => {
  const apiKey = generateApiKey();
  ctx.repos.devices.create({
    tenantId: ctx.tenantId,
    role,
    nome: `${role}-${role}`,
    apiKey,
    tableId,
  });
  return apiKey;
};

const connect = async (apiKey: string) => {
  const socket = ioClient(`http://127.0.0.1:${port}`, {
    auth: { apiKey },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', () => resolve());
    socket.once('connect_error', (err) => reject(err));
  });
  return socket;
};

beforeEach(async () => {
  ctx = setupTestDB();
  await startServer();
});

afterEach(async () => {
  for (const c of clients) c.disconnect();
  clients = [];
  await new Promise<void>((resolve) => io.close(() => resolve()));
  await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  ctx.cleanup();
});

describe('Socket.IO server', () => {
  it('rejeita conexao sem apiKey', async () => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      transports: ['websocket'],
      reconnection: false,
    });
    clients.push(socket);
    await new Promise<void>((resolve) => {
      socket.once('connect_error', (err) => {
        expect(err.message).toMatch(/api key/i);
        resolve();
      });
    });
  });

  it('aceita conexao com apiKey valida', async () => {
    const apiKey = pairDevice('totem', ctx.tableId);
    const socket = await connect(apiKey);
    expect(socket.connected).toBe(true);
  });

  it('totem recebe broadcast tenant:X', async () => {
    const apiKey = pairDevice('totem', ctx.tableId);
    const socket = await connect(apiKey);

    const events: unknown[] = [];
    socket.on('event', (e) => events.push(e));

    const broadcaster = makeSocketBroadcaster(io);
    broadcaster.broadcast({
      eventId: newEventId(),
      tenantId: ctx.tenantId,
      ts: Date.now(),
      type: 'waiter:call',
      payload: {
        tableId: ctx.tableId,
        reason: 'agua',
      },
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(events).toHaveLength(1);
  });

  it('heartbeat retorna serverTime + drift', async () => {
    const apiKey = pairDevice('kds');
    const socket = await connect(apiKey);
    const ack = await new Promise<{
      deviceId: string;
      serverTime: number;
      driftMs: number | null;
    }>((resolve) => {
      socket.emit('heartbeat', { clientTime: Date.now() - 100 }, resolve);
    });
    expect(typeof ack.serverTime).toBe('number');
    expect(ack.driftMs).toBeGreaterThanOrEqual(0);
  });

  it('state:sync retorna snapshot da mesa do totem', async () => {
    const order = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: [
        {
          id: newOrderItemId(),
          productId: ProductId.parse(randomUUID()),
          nome: 'Pizza',
          destino: 'cozinha',
          qty: 1,
          unitPriceCents: 4500,
          totalPriceCents: 4500,
          tempoEstimadoSec: 1320,
        },
      ],
      subtotalCents: 4500,
      taxaServicoBps: 0,
      taxaServicoCents: 0,
      totalCents: 4500,
    });

    const apiKey = pairDevice('totem', ctx.tableId);
    const socket = await connect(apiKey);

    const snapshot = await new Promise<{
      activeOrders: { id: string }[];
      serverTime: number;
    }>((resolve) => {
      socket.emit('state:sync', { tableId: ctx.tableId }, resolve);
    });
    expect(snapshot.activeOrders).toHaveLength(1);
    expect(snapshot.activeOrders[0]?.id).toBe(order.id);
  });
});
