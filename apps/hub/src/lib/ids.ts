import { uuidv7 } from 'uuidv7';
import type {
  DeviceId,
  EmployeeId,
  EventId,
  OrderId,
  OrderItemId,
  PaymentId,
  PreparoId,
  TableId,
  TenantId,
  WaiterCallId,
} from '@app/schemas';

export const newId = (): string => uuidv7();

export const newTenantId = () => newId() as TenantId;
export const newDeviceId = () => newId() as DeviceId;
export const newTableId = () => newId() as TableId;
export const newEmployeeId = () => newId() as EmployeeId;
export const newOrderId = () => newId() as OrderId;
export const newOrderItemId = () => newId() as OrderItemId;
export const newPreparoId = () => newId() as PreparoId;
export const newWaiterCallId = () => newId() as WaiterCallId;
export const newPaymentId = () => newId() as PaymentId;
export const newEventId = () => newId() as EventId;

export const newPairingCode = (): string =>
  Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
