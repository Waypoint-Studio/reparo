import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { daysSince, deviceLabel } from '@/domain/labels';
import type { RepairOrder } from '@/domain/types';
import { StatusPill } from '@/components/ui';

const ageLabel = (order: RepairOrder): string => {
  const days = daysSince(order.history.at(-1)?.at ?? order.createdAt);
  if (days === 0) {
    return 'Hoy';
  }
  return days === 1 ? 'Ayer' : `${days} d`;
};

export const CodeChip = ({ code }: { readonly code: string }): ReactElement => <span className="code-chip">{code}</span>;

export const OrderRow = ({ order }: { readonly order: RepairOrder }): ReactElement => (
  <Link to={`/ordenes/${order.id}`} className="row">
    <span className="row__code">{order.code}</span>
    <span className="row__main">
      <span className="row__title">{deviceLabel(order)}</span>
      <span className="row__sub">{order.issue}</span>
    </span>
    <span className="row__customer">{order.customer.name}</span>
    <span className="row__status">
      <StatusPill status={order.status} />
    </span>
    <span className="row__age">{ageLabel(order)}</span>
  </Link>
);
