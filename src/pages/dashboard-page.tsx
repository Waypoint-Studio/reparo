import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { SHOP_NAME } from '@/api/mock/messages';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Card, ErrorBox, PageHeader, Spinner } from '@/components/ui';
import { ACTIVE_STATUSES, STATUS_LABEL, UNCLAIMED_AFTER_DAYS, daysSince, deviceLabel, formatMoney } from '@/domain/labels';
import type { DashboardSummary } from '@/domain/types';
import { errorMessage, useQuery } from '@/hooks/use-query';

const Stats = ({ summary }: { readonly summary: DashboardSummary }): ReactElement => {
  const active = ACTIVE_STATUSES.reduce((sum, status) => sum + summary.byStatus[status], 0);
  const items: readonly { label: string; value: string; note: string }[] = [
    { label: 'En el local', value: String(active), note: 'equipos sin entregar' },
    { label: 'Listos para recoger', value: String(summary.byStatus.listo), note: `${summary.unclaimed.length} con más de ${UNCLAIMED_AFTER_DAYS} días` },
    { label: 'Cobrado este mes', value: formatMoney(summary.revenueThisMonth), note: `${summary.deliveredThisMonth} equipos entregados` },
    { label: 'Tiempo de reparación', value: `${summary.avgRepairDays.toFixed(1).replace('.', ',')} días`, note: 'promedio por equipo' },
  ];
  return (
    <dl className="stats">
      {items.map((item) => (
        <div key={item.label} className="stats__item">
          <dt>{item.label}</dt>
          <dd className="stats__value">{item.value}</dd>
          <dd className="stats__note">{item.note}</dd>
        </div>
      ))}
    </dl>
  );
};

const Pipeline = ({ summary }: { readonly summary: DashboardSummary }): ReactElement => {
  const total = ACTIVE_STATUSES.reduce((sum, status) => sum + summary.byStatus[status], 0) || 1;
  return (
    <Card>
      <div className="card__head">
        <h2 className="card__title">Flujo del taller</h2>
        <Link to="/ordenes" className="link-more">
          Ver órdenes
        </Link>
      </div>
      <div className="flowbar" role="img" aria-label="Distribución de equipos por estado">
        {ACTIVE_STATUSES.map((status) => (
          <span
            key={status}
            className={`flowbar__seg flowbar__seg--${status}`}
            style={{ flexGrow: summary.byStatus[status] / total }}
          />
        ))}
      </div>
      <div className="legend">
        {ACTIVE_STATUSES.map((status) => (
          <Link key={status} to={`/ordenes?estado=${status}`} className={`legend__item legend__item--${status}`}>
            <span className="legend__count">{summary.byStatus[status]}</span>
            <span className="legend__label">{STATUS_LABEL[status]}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
};

const Unclaimed = ({ summary, onChange }: { readonly summary: DashboardSummary; readonly onChange: () => void }): ReactElement => {
  const toast = useToast();
  const [sending, setSending] = useState<string | null>(null);

  const remind = (id: string): void => {
    setSending(id);
    api
      .sendReminder(id)
      .then((result) => {
        toast.whatsapp(result.message);
        onChange();
      })
      .catch((error: unknown) => toast.fail(errorMessage(error)))
      .finally(() => setSending(null));
  };

  if (summary.unclaimed.length === 0) {
    return <p className="muted">Ningún equipo lleva más de {UNCLAIMED_AFTER_DAYS} días esperando.</p>;
  }

  return (
    <ul className="stack-list">
      {summary.unclaimed.map((order) => {
        const lastReminder = order.lastReminderAt === null ? 'Sin recordatorios' : `Último aviso hace ${daysSince(order.lastReminderAt)} días`;
        return (
          <li key={order.id} className="unclaimed">
            <Link to={`/ordenes/${order.id}`} className="unclaimed__info">
              <span className="unclaimed__days">{daysSince(order.readyAt ?? order.createdAt)} d</span>
              <span>
                <span className="strong block">{deviceLabel(order)}</span>
                <span className="unclaimed__meta">
                  {order.customer.name}. {lastReminder}
                </span>
              </span>
            </Link>
            <button type="button" className="btn btn--whatsapp btn--small" onClick={() => remind(order.id)} disabled={sending === order.id}>
              <Icon name="whatsapp" size={16} />
              {sending === order.id ? 'Enviando…' : 'Recordar'}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const DashboardPage = (): ReactElement => {
  const { data, error, loading, reload } = useQuery('summary', () => api.getSummary());

  if (error !== null) {
    return <ErrorBox message={error} onRetry={reload} />;
  }
  if (data === null) {
    return <Spinner />;
  }

  return (
    <div className={`page${loading ? ' page--refreshing' : ''}`}>
      <PageHeader
        title="Tablero"
        subtitle={SHOP_NAME}
        action={
          <Link to="/ordenes/nueva" className="btn btn--primary">
            <Icon name="plus" size={18} />
            Recibir equipo
          </Link>
        }
      />

      <Stats summary={data} />
      <Pipeline summary={data} />

      <div className="grid-2">
        <Card className="card--glow">
          <div className="card__head">
            <h2 className="card__title">Equipos sin recoger</h2>
            <span className="count-badge">{data.unclaimed.length}</span>
          </div>
          <Unclaimed summary={data} onChange={reload} />
        </Card>
        <Card>
          <div className="card__head">
            <h2 className="card__title">Repuestos por agotarse</h2>
            <Link to="/repuestos" className="link-more">
              Inventario
            </Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="muted">Todo el inventario está por encima del mínimo.</p>
          ) : (
            <ul className="stack-list">
              {data.lowStock.map((part) => (
                <li key={part.id} className="stock-line">
                  <span>{part.name}</span>
                  <span className={part.stock === 0 ? 'stock-badge stock-badge--out' : 'stock-badge'}>
                    {part.stock === 0 ? 'Agotado' : `Quedan ${part.stock}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
