import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { daysSince, deviceLabel } from '@/domain/labels';
import type { RepairOrder } from '@/domain/types';
import { StatusPill } from '@/components/ui';

const ageLabel = (order: RepairOrder): string => {
  const days = daysSince(order.history.at(-1)?.at ?? order.createdAt);
  if (days === 0) {
    return 'hoy';
  }
  return days === 1 ? 'ayer' : `hace ${days} días`;
};

export const TicketNumber = ({ code, large = false }: { readonly code: string; readonly large?: boolean }): ReactElement => (
  <span className={`ticket-no${large ? ' ticket-no--large' : ''}`}>
    <span className="ticket-no__prefix">Orden</span>
    <span className="ticket-no__digits">{code.replace('RC-', '')}</span>
  </span>
);

export const OrderRow = ({ order }: { readonly order: RepairOrder }): ReactElement => (
  <Link to={`/ordenes/${order.id}`} className="ticket">
    <span className="ticket__stub">
      <TicketNumber code={order.code} />
    </span>
    <span className="ticket__body">
      <span className="ticket__device">{deviceLabel(order)}</span>
      <span className="ticket__issue">{order.issue}</span>
      <span className="ticket__customer">
        {order.customer.name}, {ageLabel(order)}
      </span>
    </span>
    <span className="ticket__status">
      <StatusPill status={order.status} />
    </span>
  </Link>
);
