// Hi-fi KDS + Garçom · Pizzaria Gigi

const HiFiKDS = () => {
  useTicker();
  const { state, dispatch } = useStore();
  const cozinha = state.orders.filter((o) => o.kind === 'cozinha');
  const queue = cozinha.filter((o) => o.status === 'queue');
  const cooking = cozinha.filter((o) => o.status === 'cooking');
  const ready = cozinha.filter((o) => o.status === 'ready');

  const ageOf = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m`;
  };

  const Ticket = ({ o, status }) => {
    const r = state.prep[o.id] ? remaining(state, o.id) : null;
    const colors = {
      queue: { border: 'var(--cream-3)', accent: 'var(--ink-3)' },
      cooking: { border: 'var(--gold)', accent: 'var(--gold-d)' },
      ready: { border: 'var(--olive)', accent: 'var(--olive-d)' },
    }[status];
    return (
      <div
        className="card"
        style={{
          padding: 10,
          borderLeft: `4px solid ${colors.border}`,
          background: status === 'ready' ? 'rgba(107, 123, 58, 0.06)' : '#fffaf0',
        }}
      >
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="display" style={{ fontSize: 14, fontWeight: 700 }}>
            mesa 07
          </span>
          <span className="mono" style={{ fontSize: 9 }}>
            #{o.id.slice(-4)} · {ageOf(o.ts)}
          </span>
        </div>
        <div className="col" style={{ gap: 2, marginBottom: 6 }}>
          {o.items.map((c) => (
            <div key={c.id} style={{ fontSize: 12, lineHeight: 1.3 }}>
              <strong>{c.qty}×</strong> {c.item.name}
            </div>
          ))}
        </div>
        {r != null && status === 'cooking' && (
          <div className="mono" style={{ color: colors.accent, marginBottom: 6, fontSize: 10 }}>
            {fmtTime(r)} restantes
          </div>
        )}
        {status === 'queue' && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
            onClick={() => dispatch({ type: 'startPrep', id: o.id })}
          >
            iniciar →
          </button>
        )}
        {status === 'cooking' && (
          <button
            className="btn btn-ready"
            style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
            onClick={() => dispatch({ type: 'markReady', id: o.id })}
          >
            marcar pronto ✓
          </button>
        )}
        {status === 'ready' && (
          <div className="mono" style={{ textAlign: 'right', color: colors.accent, fontSize: 10 }}>
            aguardando garçom
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen" style={{ background: '#1a0f08', color: 'var(--cream)' }}>
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>
            cozinha · gigi
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'rgba(247,241,230,0.5)' }}>
            3 cozinheiros · forno a lenha
          </div>
        </div>
        <div className="row" style={{ gap: 10, fontSize: 10 }}>
          <span className="mono" style={{ color: 'rgba(247,241,230,0.6)' }}>
            fila {queue.length}
          </span>
          <span className="mono" style={{ color: 'var(--gold)' }}>
            preparo {cooking.length}
          </span>
          <span className="mono" style={{ color: 'var(--olive)' }}>
            pronto {ready.length}
          </span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          padding: 8,
          height: 'calc(100% - 50px)',
          overflow: 'hidden',
        }}
      >
        {[
          { title: 'NA FILA', items: queue, status: 'queue', accent: 'rgba(247,241,230,0.4)' },
          { title: 'PREPARANDO', items: cooking, status: 'cooking', accent: 'var(--gold)' },
          { title: 'PRONTO', items: ready, status: 'ready', accent: 'var(--olive)' },
        ].map((col) => (
          <div
            key={col.title}
            style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}
          >
            <div className="mono" style={{ fontSize: 9, color: col.accent, padding: '0 4px' }}>
              {col.title} · {col.items.length}
            </div>
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {col.items.map((o) => (
                <Ticket key={o.id} o={o} status={col.status} />
              ))}
              {col.items.length === 0 && (
                <div
                  style={{
                    border: '1px dashed rgba(247,241,230,0.15)',
                    borderRadius: 'var(--r)',
                    padding: 14,
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'rgba(247,241,230,0.4)',
                  }}
                >
                  vazio
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HiFiGarcom = () => {
  useTicker();
  const { state, dispatch } = useStore();
  const pendingCalls = state.calls.filter((c) => c.status === 'pending');
  const garcomOrders = state.orders.filter((o) => o.kind === 'garcom');
  const ageOf = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `há ${s}s`;
    return `há ${Math.floor(s / 60)}m`;
  };

  return (
    <div className="screen">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cream-3)' }}>
        <div className="row between">
          <div>
            <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>
              Tiago · garçom
            </div>
            <div className="mono" style={{ fontSize: 9 }}>
              turno noturno · 6 mesas
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--cream-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            👨‍🍳
          </div>
        </div>
      </div>
      <div
        style={{
          padding: 12,
          height: 'calc(100% - 60px)',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              marginBottom: 6,
              color: pendingCalls.length ? 'var(--terracotta)' : 'var(--ink-3)',
            }}
          >
            🛎 chamados {pendingCalls.length > 0 && `· ${pendingCalls.length}`}
          </div>
          {pendingCalls.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '6px 0' }}>
              nenhum chamado
            </div>
          ) : (
            <div className="col" style={{ gap: 6 }}>
              {pendingCalls.map((c) => (
                <div
                  key={c.id}
                  className="card fade-up"
                  style={{
                    padding: 10,
                    borderLeft: '4px solid var(--terracotta)',
                    background: 'rgba(193, 74, 38, 0.06)',
                  }}
                >
                  <div className="row between">
                    <span className="display" style={{ fontSize: 16, fontWeight: 700 }}>
                      mesa {c.table}
                    </span>
                    <span className="mono" style={{ fontSize: 9 }}>
                      {ageOf(c.ts)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', margin: '4px 0 8px' }}>
                    🛎 {c.reason}
                  </div>
                  <button
                    className="btn btn-ready"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                    onClick={() => dispatch({ type: 'ackCall', id: c.id })}
                  >
                    aceitar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mono" style={{ marginBottom: 6 }}>
            📋 pedidos {garcomOrders.length > 0 && `· ${garcomOrders.length}`}
          </div>
          {garcomOrders.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '6px 0' }}>
              nenhum pedido
            </div>
          ) : (
            <div className="col" style={{ gap: 6 }}>
              {garcomOrders.map((o) => (
                <div
                  key={o.id}
                  className="card fade-up"
                  style={{
                    padding: 10,
                    borderLeft: `4px solid ${o.status === 'ready' ? 'var(--olive)' : 'var(--cream-3)'}`,
                    background: o.status === 'ready' ? 'rgba(107, 123, 58, 0.06)' : '#fffaf0',
                  }}
                >
                  <div className="row between">
                    <span className="display" style={{ fontSize: 14, fontWeight: 700 }}>
                      mesa 07
                    </span>
                    <span className="mono" style={{ fontSize: 9 }}>
                      #{o.id.slice(-4)} · {ageOf(o.ts)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, margin: '4px 0 8px' }}>
                    {o.items.map((c) => `${c.qty}× ${c.item.name}`).join(', ')}
                  </div>
                  {o.status === 'queue' ? (
                    <button
                      className="btn"
                      style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
                      onClick={() => dispatch({ type: 'serveGarcom', id: o.id })}
                    >
                      servir ✓
                    </button>
                  ) : (
                    <div
                      className="mono"
                      style={{ color: 'var(--olive-d)', textAlign: 'right', fontSize: 10 }}
                    >
                      servido ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HiFiKDS, HiFiGarcom });
