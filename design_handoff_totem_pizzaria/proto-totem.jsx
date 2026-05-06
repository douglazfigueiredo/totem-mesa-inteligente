// Totem · interactive screens for prototype
// Reads/writes the shared store

const TotemApp = () => {
  useTicker();
  const { state, dispatch } = useStore();
  const cozinhaOrder = state.orders.find(
    (o) => o.kind === 'cozinha' && (o.status === 'cooking' || o.status === 'ready'),
  );
  const showOverlayReady = state.ready != null;

  // Auto-route to timer view when an order starts cooking
  React.useEffect(() => {
    if (cozinhaOrder && cozinhaOrder.status === 'cooking' && state.view === 'confirm') {
      dispatch({ type: 'goto', view: 'timer' });
    }
  }, [cozinhaOrder?.status]);

  return (
    <Tablet>
      {state.view === 'welcome' && <T_Welcome />}
      {state.view === 'menu' && <T_Menu />}
      {state.view === 'detail' && <T_Detail />}
      {state.view === 'cart' && <T_Cart />}
      {state.view === 'confirm' && <T_Confirm />}
      {state.view === 'timer' && <T_Timer />}
      {state.view === 'history' && <T_History />}
      {state.view === 'waiter' && <T_Waiter />}
      {/* Mini timer — visible whenever there's an active cozinha order and we're not on timer view */}
      {cozinhaOrder &&
        cozinhaOrder.status === 'cooking' &&
        state.view !== 'timer' &&
        state.view !== 'welcome' && (
          <div
            className="mini-timer"
            style={{ position: 'absolute', bottom: 14, right: 14, cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'goto', view: 'timer' })}
          >
            <div className="ring">
              <span style={{ position: 'absolute', fontSize: 9 }}>
                {Math.round(
                  (1 - remaining(state, cozinhaOrder.id) / state.prep[cozinhaOrder.id].duration) *
                    100,
                )}
                %
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="wf-mono" style={{ fontSize: 10 }}>
                🍕 preparando
              </span>
              <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>
                {fmtTime(remaining(state, cozinhaOrder.id))}
              </span>
            </div>
          </div>
        )}
      {/* Ready overlay */}
      {showOverlayReady && <T_ReadyOverlay />}
      {/* Persistent "chamar garçom" */}
      {state.view !== 'welcome' && state.view !== 'waiter' && !showOverlayReady && (
        <div
          className="wf-btn"
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            fontSize: 12,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
          onClick={() => dispatch({ type: 'goto', view: 'waiter' })}
        >
          🛎 garçom
        </div>
      )}
      {/* Top nav back to history when there are orders */}
      {state.orders.length > 0 && state.view !== 'welcome' && state.view !== 'waiter' && (
        <div
          className="wf-pill"
          style={{
            position: 'absolute',
            top: 28,
            left: 14,
            fontSize: 11,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          onClick={() => dispatch({ type: 'goto', view: 'history' })}
        >
          📋 ver pedidos
        </div>
      )}
    </Tablet>
  );
};

const T_Welcome = () => {
  const { dispatch } = useStore();
  return (
    <div style={{ paddingTop: 22, display: 'flex', height: '100%' }}>
      <div
        style={{
          flex: 1,
          padding: 26,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1.5px dashed var(--line)',
        }}
      >
        <div>
          <div className="wf-mono" style={{ marginBottom: 8 }}>
            MESA 07
          </div>
          <div className="wf-h1" style={{ fontSize: 44 }}>
            boa noite!
          </div>
          <div style={{ fontSize: 15, marginTop: 12 }}>
            peça, acompanhe o preparo, chame o garçom — tudo daqui.
          </div>
        </div>
        <div className="col">
          <div
            className="wf-btn accent"
            style={{ fontSize: 18, justifyContent: 'flex-start', cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'goto', view: 'menu' })}
          >
            🍕 ver cardápio
          </div>
          <div
            className="wf-btn"
            style={{ fontSize: 16, justifyContent: 'flex-start', cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'goto', view: 'waiter' })}
          >
            🛎 chamar garçom
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="wf-mono">DESTAQUES</div>
        <div className="wf-photo wobble" style={{ flex: 1 }}>
          foto · pizza da casa
        </div>
        <div className="wf-photo wobble" style={{ height: 60 }}>
          foto · combo
        </div>
      </div>
    </div>
  );
};

const T_Menu = () => {
  const { state, dispatch } = useStore();
  const cats = ['pizzas', 'lanches', 'bebidas', 'sobremesas'];
  const [active, setActive] = React.useState('pizzas');
  const items = state.menu.filter((m) => m.cat === active);
  const cartCount = state.cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
  return (
    <div style={{ display: 'flex', height: '100%', paddingTop: 22 }}>
      <div
        style={{
          width: 120,
          borderRight: '1.5px solid var(--line)',
          padding: '14px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div className="wf-mono">CATEGORIAS</div>
        {cats.map((c) => (
          <div
            key={c}
            className="wf-box"
            style={{
              padding: '7px 10px',
              fontSize: 13,
              cursor: 'pointer',
              background: c === active ? 'var(--line)' : 'var(--paper)',
              color: c === active ? 'var(--paper)' : 'var(--ink)',
              borderRadius: 6,
            }}
            onClick={() => setActive(c)}
          >
            {c}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 14, overflow: 'auto' }}>
        <div className="wf-h2" style={{ marginBottom: 10 }}>
          {active} <span style={{ color: 'var(--accent)' }}>·</span> {items.length} opções
        </div>
        <div className="col" style={{ gap: 6 }}>
          {items.map((it) => (
            <div
              key={it.id}
              className="row wf-box"
              style={{ padding: 8, gap: 10, cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'goto', view: 'detail', item: it })}
            >
              <div className="wf-photo" style={{ width: 56, height: 44, fontSize: 9 }}>
                foto
              </div>
              <div className="grow" style={{ fontSize: 13 }}>
                {it.name}
              </div>
              <div className="wf-mono" style={{ color: 'var(--accent)' }}>
                R$ {it.price}
              </div>
              <div
                className="wf-btn"
                style={{ fontSize: 14, padding: '3px 10px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'addToCart', item: it });
                }}
              >
                +
              </div>
            </div>
          ))}
        </div>
      </div>
      {cartCount > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px 14px',
            borderTop: '1.5px solid var(--line)',
            background: 'var(--paper)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div className="wf-mono">
            {cartCount} {cartCount === 1 ? 'item' : 'itens'} · R$ {cartTotal}
          </div>
          <div
            className="wf-btn primary"
            style={{ cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'goto', view: 'cart' })}
          >
            ver carrinho →
          </div>
        </div>
      )}
    </div>
  );
};

const T_Detail = () => {
  const { state, dispatch } = useStore();
  const it = state.detailItem;
  const [qty, setQty] = React.useState(1);
  if (!it) return null;
  return (
    <div style={{ paddingTop: 22, display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 16 }}>
        <div className="wf-photo" style={{ height: 220, marginBottom: 10 }}>
          foto · {it.name}
        </div>
        <div className="wf-h2">{it.name}</div>
        <div className="wf-tiny" style={{ marginTop: 4 }}>
          preparo estimado · {Math.round(it.tempo / 60)} min
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, borderLeft: '1.5px dashed var(--line)' }}>
        <div className="wf-mono" style={{ marginBottom: 6 }}>
          ADICIONAIS
        </div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 4, fontSize: 12 }}>
          {['+ bacon', '+ catupiry', '+ azeitona', '+ cebola'].map((n) => (
            <div
              key={n}
              className="wf-pill"
              style={{ fontSize: 12, padding: '4px 8px', cursor: 'pointer' }}
            >
              {n}
            </div>
          ))}
        </div>
        <div className="wf-mono" style={{ marginBottom: 6, marginTop: 14 }}>
          OBSERVAÇÕES
        </div>
        <div
          className="wf-box dashed"
          style={{ padding: 10, minHeight: 50, fontSize: 12, color: 'var(--ink-3)' }}
        >
          ex: sem cebola, bem assada...
        </div>
        <div className="row between" style={{ marginTop: 16 }}>
          <div className="row" style={{ gap: 6 }}>
            <div
              className="wf-btn"
              style={{ width: 32, padding: 0, cursor: 'pointer' }}
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              −
            </div>
            <span className="wf-h3">{qty}</span>
            <div
              className="wf-btn"
              style={{ width: 32, padding: 0, cursor: 'pointer' }}
              onClick={() => setQty(qty + 1)}
            >
              +
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <div
              className="wf-btn ghost"
              style={{ cursor: 'pointer' }}
              onClick={() => dispatch({ type: 'goto', view: 'menu' })}
            >
              ← voltar
            </div>
            <div
              className="wf-btn primary"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                for (let i = 0; i < qty; i++) dispatch({ type: 'addToCart', item: it });
                dispatch({ type: 'goto', view: 'menu' });
              }}
            >
              add R$ {it.price * qty}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const T_Cart = () => {
  const { state, dispatch } = useStore();
  const sub = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
  if (state.cart.length === 0) {
    return (
      <div
        style={{
          paddingTop: 22,
          padding: 30,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div className="wf-h1">carrinho vazio</div>
        <div
          className="wf-btn primary"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          ← voltar pro cardápio
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        paddingTop: 22,
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div className="wf-h2">seu pedido · mesa 07</div>
      <div className="col" style={{ gap: 6, flex: 1, overflow: 'auto' }}>
        {state.cart.map((c) => (
          <div key={c.id} className="wf-box row" style={{ padding: 8, gap: 10 }}>
            <div className="wf-photo" style={{ width: 44, height: 36, fontSize: 9 }}>
              foto
            </div>
            <div className="grow">
              <div style={{ fontSize: 13 }}>{c.item.name}</div>
              <div className="row" style={{ gap: 8, marginTop: 2 }}>
                <span
                  className="wf-tiny"
                  style={{ color: 'var(--alert)', cursor: 'pointer' }}
                  onClick={() => dispatch({ type: 'removeCart', id: c.id })}
                >
                  × remover
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span
                className="wf-pill"
                style={{ padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}
                onClick={() => dispatch({ type: 'decCart', id: c.id })}
              >
                −
              </span>
              <span style={{ fontFamily: 'var(--display)' }}>{c.qty}</span>
              <span
                className="wf-pill"
                style={{ padding: '2px 8px', fontSize: 12, cursor: 'pointer' }}
                onClick={() => dispatch({ type: 'incCart', id: c.id })}
              >
                +
              </span>
            </div>
            <div className="wf-mono" style={{ width: 56, textAlign: 'right' }}>
              R$ {c.item.price * c.qty}
            </div>
          </div>
        ))}
      </div>
      <div className="wf-box fill" style={{ padding: 10 }}>
        <div className="row between" style={{ fontSize: 16, fontFamily: 'var(--display)' }}>
          <span>total</span>
          <span>R$ {sub}</span>
        </div>
      </div>
      <div className="row between">
        <div
          className="wf-btn ghost"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + add mais
        </div>
        <div
          className="wf-btn primary"
          style={{ fontSize: 15, cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'sendOrder' })}
        >
          enviar pedido →
        </div>
      </div>
    </div>
  );
};

const T_Confirm = () => {
  const { state, dispatch } = useStore();
  const lastOrder = state.orders[state.orders.length - 1];
  return (
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        gap: 14,
      }}
    >
      <div style={{ fontSize: 56 }}>✓</div>
      <div className="wf-h1">pedido enviado!</div>
      <Scribble w={120} />
      <div style={{ fontSize: 15, textAlign: 'center', maxWidth: 380 }}>
        a cozinha já recebeu. assim que começar o preparo, você vê o tempo aqui.
      </div>
      <div className="wf-mono">pedido #{lastOrder?.id.slice(-4)} · mesa 07</div>
      <div className="row" style={{ marginTop: 10 }}>
        <div
          className="wf-btn"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + pedir mais
        </div>
        <div
          className="wf-btn primary"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'timer' })}
        >
          acompanhar →
        </div>
      </div>
    </div>
  );
};

const T_Timer = () => {
  const { state, dispatch } = useStore();
  const cooking = state.orders.filter((o) => o.kind === 'cozinha' && o.status === 'cooking');
  const queue = state.orders.filter((o) => o.kind === 'cozinha' && o.status === 'queue');
  if (cooking.length === 0 && queue.length === 0) {
    return (
      <div
        style={{
          paddingTop: 22,
          padding: 30,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div className="wf-h2">nenhum pedido em preparo</div>
        <div
          className="wf-btn primary"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          fazer pedido
        </div>
      </div>
    );
  }
  if (cooking.length === 0) {
    return (
      <div
        style={{
          paddingTop: 22,
          padding: 30,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div className="wf-mono">AGUARDANDO COZINHA INICIAR</div>
        <div className="wf-h1" style={{ fontSize: 36 }}>
          na fila...
        </div>
        <div className="wf-tiny">a cozinha vai dar "iniciar" em segundos</div>
        <div
          className="wf-btn ghost"
          style={{ marginTop: 10, cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + pedir mais (sem perder)
        </div>
      </div>
    );
  }
  const main = cooking[0];
  const rem = remaining(state, main.id);
  const dur = state.prep[main.id]?.duration || 1;
  const pct = (dur - rem) / dur;
  return (
    <div style={{ paddingTop: 22, height: '100%', padding: 18, display: 'flex', gap: 18 }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div className="wf-mono">PREPARANDO · {main.items.map((i) => i.item.name).join(', ')}</div>
        <ProgRing size={170} pct={pct} label={fmtTime(rem)} sub="restantes" />
        <Scribble w={120} />
        {cooking.length > 1 && (
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            {cooking.slice(1).map((o) => {
              const r = remaining(state, o.id);
              const d = state.prep[o.id]?.duration || 1;
              return (
                <div
                  key={o.id}
                  className="wf-box"
                  style={{ padding: 4, textAlign: 'center', minWidth: 60, fontSize: 11 }}
                >
                  <ProgRing size={32} pct={(d - r) / d} label="" />
                  <div className="wf-tiny" style={{ marginTop: 1 }}>
                    {o.items[0].item.name.slice(0, 12)}
                  </div>
                  <div className="wf-mono" style={{ fontSize: 10 }}>
                    {fmtTime(r)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          justifyContent: 'center',
        }}
      >
        <div className="wf-mono">SEU PEDIDO</div>
        <div className="col" style={{ gap: 4, fontSize: 12 }}>
          {state.orders.flatMap((o) =>
            o.items.map((c) => (
              <div key={o.id + '-' + c.id} className="row between wf-box" style={{ padding: 6 }}>
                <span>
                  · {c.qty}× {c.item.name}
                </span>
                <span
                  className={`wf-pill ${o.status === 'cooking' ? 'accent' : o.status === 'ready' ? 'ready' : ''}`}
                  style={{ fontSize: 10, padding: '1px 7px' }}
                >
                  {o.status === 'cooking'
                    ? 'preparando'
                    : o.status === 'ready'
                      ? '✓ pronto'
                      : 'na fila'}
                </span>
              </div>
            )),
          )}
        </div>
        <div
          className="wf-btn ghost"
          style={{ marginTop: 8, fontSize: 13, cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + pedir mais (timer minimiza)
        </div>
      </div>
    </div>
  );
};

const T_History = () => {
  const { state, dispatch } = useStore();
  const sub = state.orders.flatMap((o) => o.items).reduce((s, c) => s + c.qty * c.item.price, 0);
  const taxa = state.taxOn ? Math.round(sub * 0.1) : 0;
  return (
    <div style={{ paddingTop: 22, padding: 14, height: '100%', overflow: 'auto' }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="wf-h2">pedidos da mesa 07</span>
        <span className="wf-mono">{state.orders.length} pedido(s)</span>
      </div>
      {state.orders.length === 0 ? (
        <div className="wf-tiny">
          nenhum pedido ainda ·{' '}
          <span
            style={{ cursor: 'pointer', color: 'var(--accent)' }}
            onClick={() => dispatch({ type: 'goto', view: 'menu' })}
          >
            fazer um?
          </span>
        </div>
      ) : (
        <div className="col" style={{ gap: 6 }}>
          {state.orders.map((o) => {
            const total = o.items.reduce((s, c) => s + c.qty * c.item.price, 0);
            return (
              <div key={o.id} className="wf-box row" style={{ padding: 9, gap: 10 }}>
                <span
                  className={`dot ${o.status === 'cooking' ? 'preparing' : o.status === 'ready' ? 'ready' : 'waiting'}`}
                />
                <div className="grow">
                  <div className="row" style={{ gap: 8 }}>
                    <span className="wf-mono">#{o.id.slice(-4)}</span>
                    <span className="wf-tiny">
                      {o.kind} · {o.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {o.items.map((c) => `${c.qty}× ${c.item.name}`).join(', ')}
                  </div>
                </div>
                <span className="wf-mono">R$ {total}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="wf-box fill" style={{ padding: 10, marginTop: 12 }}>
        <div className="row between">
          <span>subtotal</span>
          <span className="wf-mono">R$ {sub}</span>
        </div>
        <div className="row between" style={{ marginTop: 4 }}>
          <span
            className="row"
            style={{ gap: 8, cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'toggleTax' })}
          >
            <span
              className="wf-pill"
              style={{
                padding: '0 6px',
                minWidth: 18,
                justifyContent: 'center',
                background: state.taxOn ? 'var(--line)' : 'var(--paper)',
                color: state.taxOn ? 'var(--paper)' : 'var(--ink-3)',
                border: '1.5px solid var(--line)',
                fontSize: 11,
              }}
            >
              {state.taxOn ? '✓' : ''}
            </span>
            serviço 10% (opcional)
          </span>
          <span className="wf-mono">R$ {taxa}</span>
        </div>
        <div
          className="row between"
          style={{ marginTop: 6, fontSize: 16, fontFamily: 'var(--display)' }}
        >
          <span>total</span>
          <span>R$ {sub + taxa}</span>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 10 }}>
        <div
          className="wf-btn ghost"
          style={{ cursor: 'pointer' }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + pedido
        </div>
        <div className="wf-btn">dividir conta</div>
        <div className="wf-btn primary">pedir conta</div>
      </div>
    </div>
  );
};

const T_Waiter = () => {
  const { state, dispatch } = useStore();
  const lastCall = state.calls[state.calls.length - 1];
  const just = lastCall && Date.now() - lastCall.ts < 30000;
  const [dragX, setDragX] = React.useState(0);
  const trackRef = React.useRef(null);
  const draggingRef = React.useRef(false);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width - 70, e.clientX - r.left - 35));
    setDragX(x);
    if (x >= r.width - 80) {
      draggingRef.current = false;
      dispatch({ type: 'callWaiter', reason: 'chamado' });
      setDragX(0);
    }
  };
  const onPointerUp = () => {
    draggingRef.current = false;
    setDragX(0);
  };

  return (
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div className="wf-h2">arrasta o sino pra chamar →</div>
      <Scribble w={140} />
      <div
        ref={trackRef}
        style={{ position: 'relative', width: 360, height: 80 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 70,
            border: '2px dashed var(--line)',
            borderRadius: 999,
            background: 'var(--paper-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 18,
            fontSize: 14,
            color: 'var(--ink-3)',
          }}
        >
          solta aqui →
        </div>
        <div
          onPointerDown={onPointerDown}
          style={{
            position: 'absolute',
            top: 0,
            left: dragX,
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            boxShadow: '4px 4px 0 var(--line)',
            border: '2px solid var(--line)',
            cursor: 'grab',
            touchAction: 'none',
            transition: draggingRef.current ? 'none' : 'left .2s',
          }}
        >
          🛎
        </div>
      </div>
      {just ? (
        <div
          className="wf-box"
          style={{
            padding: '10px 16px',
            marginTop: 4,
            background: 'var(--accent-soft)',
            borderColor: 'var(--accent)',
            borderWidth: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>✓</span>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 15 }}>a caminho!</div>
            <div className="wf-tiny">
              <span className="dot preparing" /> garçom <strong>Tiago</strong> vendo · ~2 min
            </div>
          </div>
        </div>
      ) : (
        <div className="wf-tiny">swipe-to-call evita chamado por toque acidental</div>
      )}
      <div
        className="wf-btn ghost"
        style={{ marginTop: 8, cursor: 'pointer' }}
        onClick={() =>
          dispatch({
            type: 'goto',
            view: state.cart.length ? 'cart' : state.orders.length ? 'history' : 'menu',
          })
        }
      >
        ← voltar
      </div>
    </div>
  );
};

const T_ReadyOverlay = () => {
  const { state, dispatch } = useStore();
  const order = state.orders.find((o) => o.id === state.ready);
  if (!order) return null;
  const itemNames = order.items.map((c) => c.item.name).join(' + ');
  return (
    <div
      style={{
        position: 'absolute',
        top: 22,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(26,23,20,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <div
        className="wf-box wobble"
        style={{
          width: 420,
          padding: 24,
          background: 'var(--ready-soft)',
          borderColor: 'var(--ready)',
          borderWidth: 2.5,
          boxShadow: '6px 6px 0 var(--line)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 50, animation: 'wiggle 1s infinite' }}>🛎️</div>
        <div className="wf-h1" style={{ fontSize: 36 }}>
          tá pronto!
        </div>
        <Scribble w={120} color="var(--ready)" />
        <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 320 }}>
          {itemNames} {order.kind === 'cozinha' ? 'saiu do forno.' : 'tá indo pra mesa.'}
        </div>
        <div className="row" style={{ marginTop: 4, gap: 8 }}>
          <div
            className="wf-btn ready"
            style={{ cursor: 'pointer' }}
            onClick={() => dispatch({ type: 'closeReady' })}
          >
            ok, voltar →
          </div>
        </div>
      </div>
      <style>{`@keyframes wiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }`}</style>
    </div>
  );
};

Object.assign(window, { TotemApp });
