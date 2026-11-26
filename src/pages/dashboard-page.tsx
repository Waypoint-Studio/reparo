import { useState, type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast';
import { Card, ErrorBox, Spinner } from '@/components/ui';
import { ACTIVE_STATUSES, STATUS_LABEL, UNCLAIMED_AFTER_DAYS, daysSince, deviceLabel, formatMoney } from '@/domain/labels';
import type { DashboardSummary } from '@/domain/types';
import { errorMessage, useQuery } from '@/hooks/use-query';

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

const Today = ({ summary }: { readonly summary: DashboardSummary }): ReactElement => {
  const active = ACTIVE_STATUSES.reduce((sum, status) => sum + summary.byStatus[status], 0);
  const ready = summary.byStatus.listo;
  const waiting = summary.byStatus.esperando_aprobacion;
  return (
    <section className="today">
      <h1 className="today__headline">
        {plural(active, 'equipo', 'equipos')} en el local
      </h1>
      <p className="today__sentence">
        {plural(ready, 'está listo', 'están listos')} para recoger
        {summary.unclaimed.length > 0 ? ` y ${plural(summary.unclaimed.length, 'lleva', 'llevan')} más de ${UNCLAIMED_AFTER_DAYS} días esperando` : ''}.{' '}
        {waiting > 0 ? `${plural(waiting, 'cliente no ha', 'clientes no han')} respondido el presupuesto.` : 'Ningún presupuesto pendiente de respuesta.'}
      </p>
      <dl className="today__facts">
        <div>
          <dt>Cobrado este mes</dt>
          <dd>{formatMoney(summary.revenueThisMonth)}</dd>
        </div>
        <div>
          <dt>Equipos entregados</dt>
          <dd>{summary.deliveredThisMonth}</dd>
        </div>
        <div>
          <dt>Días promedio en reparar</dt>
          <dd>{summary.avgRepairDays.toFixed(1).replace('.', ',')}</dd>
        </div>
      </dl>
      <Link to="/ordenes/nueva" className="btn btn--primary today__cta">
        <Icon name="plus" size={18} />
        Recibir equipo
      </Link>
    </section>
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
              <span className="unclaimed__days">
                <strong>{daysSince(order.readyAt ?? order.createdAt)}</strong> días
              </span>
              <span>
                <span className="strong block">{deviceLabel(order)}</span>
                <span className="small block">{order.customer.name}</span>
                <span className="unclaimed__meta">{lastReminder}</span>
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
      <Today summary={data} />

      <section className="tray" aria-label="Equipos por estado">
        {ACTIVE_STATUSES.map((status) => (
          <Link key={status} to={`/ordenes?estado=${status}`} className={`tray__slot tray__slot--${status}`}>
            <span className="tray__count">{data.byStatus[status]}</span>
            <span className="tray__label">{STATUS_LABEL[status]}</span>
          </Link>
        ))}
      </section>

      <div className="grid-2">
        <Card className="card--attention">
          <h2 className="card__title">Equipos sin recoger</h2>
          <Unclaimed summary={data} onChange={reload} />
        </Card>
        <Card>
          <h2 className="card__title">Repuestos por agotarse</h2>
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
          <Link to="/repuestos" className="link-more">
            Ver inventario
          </Link>
        </Card>
      </div>
    </div>
  );
};
