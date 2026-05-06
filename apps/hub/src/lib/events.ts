import type { WSEvent, WSEventType, EventId, TenantId } from '@app/schemas';
import { newEventId } from './ids.js';

type EventPayload<T extends WSEventType> = Extract<WSEvent, { type: T }>['payload'];

export const makeEvent = <T extends WSEventType>(
  type: T,
  tenantId: TenantId,
  payload: EventPayload<T>,
  causedBy?: EventId,
): WSEvent => {
  const ev = {
    eventId: newEventId(),
    tenantId,
    ts: Date.now(),
    type,
    payload,
    causedBy,
  };
  return ev as WSEvent;
};
