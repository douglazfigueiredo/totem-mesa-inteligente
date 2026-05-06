// KDS + Garçom · interactive prototype panels
// These read the same store as the totem.

const KDSApp = () => {
  useTicker();
  const { state, dispatch } = useStore();
  const cozinhaOrders = state.orders.filter((o) => o.kind === 'cozinha');
  const queue = cozinhaOrders.filter((o) => o.status === 'queue');
  const cooking = cozinhaOrders.filter((o) => o.status === 'cooking');
  const ready = cozinhaOrders.filter((o) => o.status === 'ready');

  const ticket = (o, status) => {
    const total = o.items.reduce((s, c) => s + c.qty, 0);
    const r = state.prep[o.id] ? remaining(state, o.id) : null;
    const colors = {
      queue: { bg: 'var(--paper)', border: 'var(--line)' },
      cooking: { bg: 'var(--accent-soft)', border: 'var(--accent)' },
      ready: { bg: 'var(--ready-soft)', border: 'var(--ready)' },
    }[status];
    return (
      <div
        key={o.id}
        className="wf-box"
        style={{
          padding: 8,
          background: colors.bg,
          borderColor: colors.border,
          borderWidth: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          fontSize: 11,
        }}
      >
        <div className="row between">
          <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>mesa 07</span>
          <span className="wf-mono">#{o.id.slice(-4)}</span>
        </div>
        <div className="col" style={{ gap: 1, fontSize: 11, lineHeight: 1.2 }}>
          {o.items.map((c) => (
            <div key={c.id}>
              · {c.qty}× {c.item.name}
            </div>
          ))}
        </div>
        {r != null && status === 'cooking' && (
          <div
            className="wf-mono"
            style={{ marginTop: 2, color: 'var(--accent)', textAlign: 'right' }}
          >
            {fmtTime(r)} restantes
          </div>
        )}
        {status === 'queue' && (
          <div
            className="wf-btn primary"
            style={{ fontSize: 11, padding: '4px 8px', marginTop: 2, cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'startPrep', id: o.id })}
          >
            iniciar →
          </div>
        )}
        {status === 'cooking' && (
          <div
            className="wf-btn ready"
            style={{ fontSize: 11, padding: '4px 8px', marginTop: 2, cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'markReady', id: o.id })}
          >
            marcar pronto ✓
          </div>
        )}
        {status === 'ready' && (
          <div className="wf-tiny" style={{ textAlign: 'right', color: 'var(--ready)' }}>
            aguardando garçom
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tablet-frame" style={{ padding: 8, borderRadius: 8 }}>
      <div className="tablet-screen">
        <div
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontFamily: 'var(--display)', fontSize: 15 }}>
            cozinha · pizzaria gigi
          </span>
          <div className="row" style={{ gap: 12, fontSize: 10, fontFamily: 'var(--mono)' }}>
            <span>fila {queue.length}</span>
            <span style={{ color: 'var(--accent)' }}>fazendo {cooking.length}</span>
            <span style={{ color: 'var(--ready)' }}>pronto {ready.length}</span>
          </div>
        </div>
        <div
          style={{
            padding: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            height: 'calc(100% - 28px)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflow: 'auto' }}>
            <div className="wf-mono" style={{ marginBottom: 4, fontSize: 9 }}>
              NA FILA · {queue.length}
            </div>
            <div className="col" style={{ gap: 4 }}>
              {queue.map((o) => ticket(o, 'queue'))}
            </div>
            {queue.length === 0 && (
              <div className="wf-tiny" style={{ fontSize: 10 }}>
                vazio
              </div>
            )}
          </div>
          <div style={{ overflow: 'auto' }}>
            <div
              className="wf-mono"
              style={{ marginBottom: 4, fontSize: 9, color: 'var(--accent)' }}
            >
              PREPARANDO · {cooking.length}
            </div>
            <div className="col" style={{ gap: 4 }}>
              {cooking.map((o) => ticket(o, 'cooking'))}
            </div>
            {cooking.length === 0 && (
              <div className="wf-tiny" style={{ fontSize: 10 }}>
                vazio
              </div>
            )}
          </div>
          <div style={{ overflow: 'auto' }}>
            <div
              className="wf-mono"
              style={{ marginBottom: 4, fontSize: 9, color: 'var(--ready)' }}
            >
              PRONTO · {ready.length}
            </div>
            <div className="col" style={{ gap: 4 }}>
              {ready.map((o) => ticket(o, 'ready'))}
            </div>
            {ready.length === 0 && (
              <div className="wf-tiny" style={{ fontSize: 10 }}>
                vazio
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GarcomApp = () => {
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
    <div className="tablet-frame" style={{ padding: 8, borderRadius: 8 }}>
      <div className="tablet-screen" style={{ background: 'var(--paper-2)' }}>
        <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 12px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 15 }}>garçom · Tiago</div>
          <div className="wf-mono" style={{ fontSize: 9, opacity: 0.7 }}>
            turno · 6 mesas atendendo
          </div>
        </div>
        <div style={{ padding: 10, height: 'calc(100% - 36px)', overflow: 'auto' }}>
          <div
            className="wf-mono"
            style={{
              marginBottom: 6,
              color: pendingCalls.length ? 'var(--accent)' : 'var(--ink-3)',
              fontSize: 10,
            }}
          >
            🛎 CHAMADOS · {pendingCalls.length}
          </div>
          {pendingCalls.length === 0 && (
            <div className="wf-tiny" style={{ fontSize: 10 }}>
              nenhum
            </div>
          )}
          <div className="col" style={{ gap: 5 }}>
            {pendingCalls.map((c) => (
              <div
                key={c.id}
                className="wf-box"
                style={{
                  padding: 7,
                  borderColor: 'var(--accent)',
                  borderWidth: 2,
                  background: 'var(--accent-soft)',
                  fontSize: 11,
                }}
              >
                <div className="row between">
                  <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>mesa {c.table}</span>
                  <span className="wf-mono" style={{ fontSize: 10 }}>
                    {ageOf(c.ts)}
                  </span>
                </div>
                <div style={{ fontSize: 11 }}>🛎 {c.reason}</div>
                <div className="row" style={{ gap: 4, marginTop: 4 }}>
                  <div
                    className="wf-btn ready"
                    style={{ fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}
                    onClick={() => dispatch({ type: 'ackCall', id: c.id })}
                  >
                    aceitar
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="wf-mono" style={{ marginTop: 12, marginBottom: 6, fontSize: 10 }}>
            📋 PEDIDOS · {garcomOrders.length}
          </div>
          {garcomOrders.length === 0 && (
            <div className="wf-tiny" style={{ fontSize: 10 }}>
              nenhum
            </div>
          )}
          <div className="col" style={{ gap: 4 }}>
            {garcomOrders.map((o) => (
              <div
                key={o.id}
                className="wf-box row between"
                style={{
                  padding: 6,
                  fontSize: 11,
                  background: o.status === 'ready' ? 'var(--ready-soft)' : 'var(--paper)',
                  borderColor: o.status === 'ready' ? 'var(--ready)' : 'var(--line)',
                }}
              >
                <div className="grow">
                  <span className="wf-mono" style={{ fontSize: 9 }}>
                    mesa 07 · #{o.id.slice(-4)}
                  </span>
                  <div style={{ fontSize: 11 }}>
                    {o.items.map((c) => `${c.qty}× ${c.item.name}`).join(', ')}
                  </div>
                </div>
                {o.status === 'queue' && (
                  <div
                    className="wf-btn"
                    style={{ fontSize: 10, padding: '2px 8px', cursor: 'pointer' }}
                    onClick={() => dispatch({ type: 'serveGarcom', id: o.id })}
                  >
                    servir ✓
                  </div>
                )}
                {o.status === 'ready' && (
                  <span className="wf-tiny" style={{ color: 'var(--ready)' }}>
                    servido
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { KDSApp, GarcomApp });
