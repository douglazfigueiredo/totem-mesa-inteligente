// Hi-fi totem · Pizzaria Gigi
// Reads/writes the same shared store from proto-store.jsx

// Photo URLs (Unsplash)
const PHOTOS = {
  // pizzas
  p1: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80', // calabresa-ish
  p2: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80', // margherita
  p3: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&q=80', // portuguesa-ish
  p4: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80', // 4 queijos
  l1: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', // burger bacon
  l2: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&q=80', // duplo
  l3: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800&q=80', // veggie
  b1: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=800&q=80', // soda
  b2: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80', // água
  b3: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80', // suco
  s1: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80', // brownie
  hero: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=80',
  ambient: 'https://images.unsplash.com/photo-1542528180-a1208c5169a5?w=1200&q=80',
};

const HiFiTotem = () => {
  useTicker();
  const { state, dispatch } = useStore();
  const cozinhaOrder = state.orders.find(
    (o) => o.kind === 'cozinha' && (o.status === 'cooking' || o.status === 'ready'),
  );
  const showOverlayReady = state.ready != null;

  React.useEffect(() => {
    if (cozinhaOrder && cozinhaOrder.status === 'cooking' && state.view === 'confirm') {
      const t = setTimeout(() => dispatch({ type: 'goto', view: 'timer' }), 1200);
      return () => clearTimeout(t);
    }
  }, [cozinhaOrder?.status]);

  return (
    <div className="screen paper-texture">
      <div className="topbar">
        <div className="row" style={{ gap: 10 }}>
          {state.view !== 'welcome' && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 13 }}
              onClick={() =>
                dispatch({ type: 'goto', view: state.view === 'menu' ? 'welcome' : 'menu' })
              }
            >
              ←
            </button>
          )}
          <span className="display" style={{ fontSize: 18, fontWeight: 700 }}>
            Pizzaria Gigi
          </span>
          <span className="tag tag-gold">mesa 07</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {state.orders.length > 0 && state.view !== 'welcome' && state.view !== 'history' && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 13 }}
              onClick={() => dispatch({ type: 'goto', view: 'history' })}
            >
              📋 pedidos · {state.orders.length}
            </button>
          )}
          {state.view !== 'waiter' && state.view !== 'welcome' && (
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 13 }}
              onClick={() => dispatch({ type: 'goto', view: 'waiter' })}
            >
              🛎 garçom
            </button>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', inset: '52px 0 0 0' }}>
        {state.view === 'welcome' && <H_Welcome />}
        {state.view === 'menu' && <H_Menu />}
        {state.view === 'detail' && <H_Detail />}
        {state.view === 'cart' && <H_Cart />}
        {state.view === 'confirm' && <H_Confirm />}
        {state.view === 'timer' && <H_Timer />}
        {state.view === 'history' && <H_History />}
        {state.view === 'waiter' && <H_Waiter />}
      </div>

      {/* Mini timer */}
      {cozinhaOrder &&
        cozinhaOrder.status === 'cooking' &&
        state.view !== 'timer' &&
        state.view !== 'welcome' && (
          <MiniTimer
            order={cozinhaOrder}
            onClick={() => dispatch({ type: 'goto', view: 'timer' })}
          />
        )}
      {showOverlayReady && <H_ReadyOverlay />}
    </div>
  );
};

const MiniTimer = ({ order, onClick }) => {
  const { state } = useStore();
  const r = remaining(state, order.id);
  const dur = state.prep[order.id]?.duration || 1;
  const pct = (dur - r) / dur;
  const C = 2 * Math.PI * 18;
  return (
    <button
      onClick={onClick}
      className="card fade-up"
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px 8px 8px',
        cursor: 'pointer',
        border: 'none',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="22" cy="22" r="18" fill="none" className="ring-bg" strokeWidth="3.5" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            className="ring-fg"
            strokeWidth="3.5"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          🍕
        </span>
      </div>
      <div style={{ textAlign: 'left' }}>
        <div className="mono" style={{ fontSize: 9 }}>
          preparando
        </div>
        <div className="display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
          {fmtTime(r)}
        </div>
      </div>
    </button>
  );
};

const H_Welcome = () => {
  const { dispatch } = useStore();
  return (
    <div
      className="fade-up"
      style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 0 }}
    >
      <div
        style={{
          padding: '24px 32px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div className="mono" style={{ marginBottom: 12 }}>
            Mesa 07 · Salão Principal
          </div>
          <h1
            className="display"
            style={{ fontSize: 56, lineHeight: 1.0, margin: 0, color: 'var(--ink)' }}
          >
            <span className="display-italic">boa</span> noite,
            <br />o que vai ser?
          </h1>
          <div
            style={{
              marginTop: 14,
              fontSize: 15,
              color: 'var(--ink-2)',
              maxWidth: 360,
              lineHeight: 1.4,
            }}
          >
            peça aqui mesmo, acompanhe o preparo em tempo real e chame o garçom quando precisar.
          </div>
        </div>
        <div className="col" style={{ gap: 10 }}>
          <button
            className="btn btn-primary btn-lg"
            style={{ justifyContent: 'space-between', width: '100%' }}
            onClick={() => dispatch({ type: 'goto', view: 'menu' })}
          >
            <span>ver cardápio</span>
            <span style={{ fontSize: 18 }}>→</span>
          </button>
          <button
            className="btn btn-lg"
            style={{ justifyContent: 'space-between', width: '100%' }}
            onClick={() => dispatch({ type: 'goto', view: 'waiter' })}
          >
            <span>🛎 chamar garçom</span>
            <span style={{ fontSize: 18 }}>→</span>
          </button>
        </div>
        <div className="row" style={{ gap: 14, color: 'var(--ink-3)', fontSize: 12 }}>
          <span>WiFi · gigi-livre</span>
          <span>·</span>
          <span>senha · margherita</span>
        </div>
      </div>
      <div style={{ padding: 16, position: 'relative' }}>
        <div
          className="photo"
          style={{
            height: '100%',
            width: '100%',
            backgroundImage: `url(${PHOTOS.hero})`,
          }}
        />
        <div
          className="stamp"
          style={{
            position: 'absolute',
            top: 30,
            right: 30,
            background: 'rgba(247, 241, 230, 0.96)',
          }}
        >
          desde 1987
        </div>
      </div>
    </div>
  );
};

const H_Menu = () => {
  const { state, dispatch } = useStore();
  const cats = [
    { id: 'pizzas', label: 'pizzas' },
    { id: 'lanches', label: 'lanches' },
    { id: 'bebidas', label: 'bebidas' },
    { id: 'sobremesas', label: 'sobremesas' },
  ];
  const [active, setActive] = React.useState('pizzas');
  const items = state.menu.filter((m) => m.cat === active);
  const cartCount = state.cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 24px 14px', borderBottom: '1px solid var(--cream-3)' }}>
        <div className="row" style={{ gap: 4, overflow: 'auto' }}>
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className="btn"
              style={{
                background: active === c.id ? 'var(--ink)' : 'transparent',
                color: active === c.id ? 'var(--cream)' : 'var(--ink-2)',
                fontFamily: 'var(--display)',
                fontWeight: 600,
                fontSize: 16,
                padding: '8px 16px',
                borderRadius: 'var(--r-pill)',
                fontStyle: active === c.id ? 'italic' : 'normal',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {items.map((it) => (
            <button
              key={it.id}
              className="card fade-up"
              style={{
                border: 'none',
                textAlign: 'left',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onClick={() => dispatch({ type: 'goto', view: 'detail', item: it })}
            >
              <div
                className="photo"
                style={{
                  height: 130,
                  width: '100%',
                  backgroundImage: `url(${PHOTOS[it.id]})`,
                  borderRadius: 0,
                }}
              />
              <div
                style={{
                  padding: '10px 12px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div className="display" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.2 }}>
                  {it.name}
                </div>
                <div className="row between">
                  <span className="mono" style={{ color: 'var(--ink-3)' }}>
                    ~{Math.round(it.tempo / 60) || 1} min
                  </span>
                  <span
                    className="display"
                    style={{ fontSize: 18, fontWeight: 700, color: 'var(--terracotta)' }}
                  >
                    R$ {it.price}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {cartCount > 0 && (
        <div
          className="fade-up"
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
            right: 14,
            background: 'var(--ink)',
            color: 'var(--cream)',
            padding: '10px 16px',
            borderRadius: 'var(--r-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="row" style={{ gap: 12 }}>
            <span className="display" style={{ fontSize: 18, fontWeight: 600 }}>
              {cartCount} {cartCount === 1 ? 'item' : 'itens'}
            </span>
            <span style={{ opacity: 0.7 }}>·</span>
            <span className="display" style={{ fontSize: 18 }}>
              R$ {cartTotal}
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'goto', view: 'cart' })}
          >
            ver carrinho →
          </button>
        </div>
      )}
    </div>
  );
};

const H_Detail = () => {
  const { state, dispatch } = useStore();
  const it = state.detailItem;
  const [qty, setQty] = React.useState(1);
  const [obs, setObs] = React.useState('');
  if (!it) return null;
  return (
    <div
      className="fade-up"
      style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr' }}
    >
      <div style={{ padding: 18 }}>
        <div
          className="photo"
          style={{
            height: '100%',
            width: '100%',
            backgroundImage: `url(${PHOTOS[it.id]})`,
          }}
        />
      </div>
      <div
        style={{
          padding: '20px 24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflow: 'auto',
        }}
      >
        <div>
          <div className="row" style={{ gap: 6 }}>
            <span className="tag tag-gold">{it.cat}</span>
            <span className="tag">~{Math.round(it.tempo / 60) || 1} min</span>
          </div>
          <h2 className="display" style={{ fontSize: 28, margin: '8px 0 4px', lineHeight: 1.1 }}>
            {it.name}
          </h2>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
            massa de fermentação natural 48h, queijo mussarela de búfala e ingredientes selecionados
            da região.
          </div>
        </div>
        <div>
          <div className="mono" style={{ marginBottom: 6 }}>
            adicionais
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {[
              ['+ bacon', 6],
              ['+ catupiry', 5],
              ['+ azeitona', 4],
              ['+ cebola', 3],
              ['+ borda recheada', 8],
            ].map(([n, p]) => (
              <button
                key={n}
                className="tag"
                style={{ cursor: 'pointer', padding: '6px 12px', background: 'var(--cream-2)' }}
              >
                <span>{n}</span>
                <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>+R${p}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mono" style={{ marginBottom: 6 }}>
            observações
          </div>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="ex: sem cebola, bem assada..."
            style={{
              width: '100%',
              minHeight: 60,
              resize: 'vertical',
              padding: 10,
              borderRadius: 'var(--r)',
              border: '1px solid var(--cream-3)',
              background: '#fffaf0',
              fontFamily: 'var(--body)',
              fontSize: 13,
              color: 'var(--ink)',
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <div className="row between" style={{ marginTop: 'auto' }}>
          <div
            className="row"
            style={{ background: 'var(--cream-2)', borderRadius: 'var(--r-pill)', padding: '4px' }}
          >
            <button
              className="btn btn-icon"
              style={{ padding: 6, width: 32, height: 32, background: 'transparent' }}
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              −
            </button>
            <span className="display" style={{ fontSize: 18, minWidth: 24, textAlign: 'center' }}>
              {qty}
            </span>
            <button
              className="btn btn-icon"
              style={{ padding: 6, width: 32, height: 32, background: 'transparent' }}
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              for (let i = 0; i < qty; i++) dispatch({ type: 'addToCart', item: it });
              dispatch({ type: 'goto', view: 'menu' });
            }}
          >
            adicionar · R$ {it.price * qty}
          </button>
        </div>
      </div>
    </div>
  );
};

const H_Cart = () => {
  const { state, dispatch } = useStore();
  const sub = state.cart.reduce((s, c) => s + c.qty * c.item.price, 0);
  if (state.cart.length === 0) {
    return (
      <div
        className="fade-up"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div style={{ fontSize: 48 }}>🍽</div>
        <div className="display" style={{ fontSize: 24 }}>
          seu carrinho tá vazio
        </div>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          ← voltar pro cardápio
        </button>
      </div>
    );
  }
  return (
    <div
      className="fade-up"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 22px 18px',
      }}
    >
      <h2 className="display" style={{ fontSize: 24, margin: '0 0 12px' }}>
        seu pedido
      </h2>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="col" style={{ gap: 10 }}>
          {state.cart.map((c) => (
            <div
              key={c.id}
              className="card"
              style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <div
                className="photo"
                style={{
                  width: 64,
                  height: 56,
                  backgroundImage: `url(${PHOTOS[c.id]})`,
                  flexShrink: 0,
                }}
              />
              <div className="grow">
                <div className="display" style={{ fontSize: 15, fontWeight: 600 }}>
                  {c.item.name}
                </div>
                <div
                  className="row"
                  style={{ gap: 8, fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}
                >
                  <span>R$ {c.item.price}</span>
                  <span>·</span>
                  <button
                    onClick={() => dispatch({ type: 'removeCart', id: c.id })}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--terracotta)',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 12,
                    }}
                  >
                    remover
                  </button>
                </div>
              </div>
              <div
                className="row"
                style={{ background: 'var(--cream-2)', borderRadius: 'var(--r-pill)', padding: 2 }}
              >
                <button
                  className="btn btn-icon"
                  style={{
                    padding: 4,
                    width: 28,
                    height: 28,
                    background: 'transparent',
                    fontSize: 16,
                  }}
                  onClick={() => dispatch({ type: 'decCart', id: c.id })}
                >
                  −
                </button>
                <span
                  className="display"
                  style={{ minWidth: 22, textAlign: 'center', fontSize: 15 }}
                >
                  {c.qty}
                </span>
                <button
                  className="btn btn-icon"
                  style={{
                    padding: 4,
                    width: 28,
                    height: 28,
                    background: 'transparent',
                    fontSize: 16,
                  }}
                  onClick={() => dispatch({ type: 'incCart', id: c.id })}
                >
                  +
                </button>
              </div>
              <div
                className="display"
                style={{ fontSize: 16, fontWeight: 700, minWidth: 60, textAlign: 'right' }}
              >
                R$ {c.item.price * c.qty}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="card-flat"
        style={{
          padding: 14,
          marginTop: 12,
          background: 'var(--cream-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div className="mono">total</div>
          <div className="display" style={{ fontSize: 28, fontWeight: 700 }}>
            R$ {sub}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: 'goto', view: 'menu' })}
          >
            + adicionar
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => dispatch({ type: 'sendOrder' })}
          >
            enviar pedido →
          </button>
        </div>
      </div>
    </div>
  );
};

const H_Confirm = () => {
  const { state, dispatch } = useStore();
  const lastOrder = state.orders[state.orders.length - 1];
  return (
    <div
      className="fade-up"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 30,
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          background: 'var(--olive)',
          color: '#fbfaee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 44,
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(107, 123, 58, 0.3)',
        }}
      >
        ✓
      </div>
      <h1
        className="display"
        style={{ fontSize: 36, margin: 0, textAlign: 'center', lineHeight: 1.1 }}
      >
        <span className="display-italic">pedido</span> recebido!
      </h1>
      <div
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          textAlign: 'center',
          maxWidth: 360,
          lineHeight: 1.4,
        }}
      >
        a cozinha já viu. assim que iniciar o preparo, o tempo aparece aqui em tempo real.
      </div>
      <div className="tag tag-gold" style={{ fontSize: 12 }}>
        pedido #{lastOrder?.id.slice(-4)} · mesa 07
      </div>
      <div className="row" style={{ marginTop: 8, gap: 8 }}>
        <button className="btn" onClick={() => dispatch({ type: 'goto', view: 'menu' })}>
          + pedir mais
        </button>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'goto', view: 'timer' })}
        >
          acompanhar →
        </button>
      </div>
    </div>
  );
};

const H_Timer = () => {
  const { state, dispatch } = useStore();
  const cooking = state.orders.filter((o) => o.kind === 'cozinha' && o.status === 'cooking');
  const queue = state.orders.filter((o) => o.kind === 'cozinha' && o.status === 'queue');
  if (cooking.length === 0 && queue.length === 0) {
    return (
      <div
        className="fade-up"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div className="display" style={{ fontSize: 22 }}>
          nada em preparo
        </div>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          fazer pedido
        </button>
      </div>
    );
  }
  if (cooking.length === 0) {
    return (
      <div
        className="fade-up"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            border: '3px dashed var(--cream-3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          👨‍🍳
        </div>
        <div className="mono">aguardando cozinha iniciar</div>
        <div className="display" style={{ fontSize: 28 }}>
          na fila...
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          a cozinha vai dar "iniciar" em segundos
        </div>
      </div>
    );
  }
  const main = cooking[0];
  const r = remaining(state, main.id);
  const dur = state.prep[main.id]?.duration || 1;
  const pct = (dur - r) / dur;
  const C = 2 * Math.PI * 92;
  return (
    <div
      className="fade-up"
      style={{ height: '100%', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 0 }}
    >
      <div
        style={{
          padding: '14px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div className="mono">preparando · pedido #{main.id.slice(-4)}</div>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r="92" fill="none" className="ring-bg" strokeWidth="10" />
            <circle
              cx="110"
              cy="110"
              r="92"
              fill="none"
              className="ring-fg"
              strokeWidth="10"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <div
              className="display"
              style={{
                fontSize: 50,
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtTime(r)}
            </div>
            <div className="mono" style={{ color: 'var(--terracotta)' }}>
              restantes
            </div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', textAlign: 'center', maxWidth: 280 }}>
          {main.items.map((i) => i.item.name).join(', ')}
        </div>
        <button
          className="btn btn-ghost"
          style={{ marginTop: 6 }}
          onClick={() => dispatch({ type: 'goto', view: 'menu' })}
        >
          + pedir mais (timer minimiza)
        </button>
      </div>
      <div
        style={{ padding: '20px 20px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div className="mono">seu pedido</div>
        <div className="card" style={{ padding: 12, flex: 1, overflow: 'auto' }}>
          <div className="col" style={{ gap: 10 }}>
            {state.orders.flatMap((o) =>
              o.items.map((c) => (
                <div key={o.id + '-' + c.id} className="row" style={{ gap: 10 }}>
                  <div
                    className="photo"
                    style={{
                      width: 38,
                      height: 32,
                      backgroundImage: `url(${PHOTOS[c.id]})`,
                      flexShrink: 0,
                    }}
                  />
                  <div className="grow">
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {c.qty}× {c.item.name}
                    </div>
                    <div className="mono" style={{ marginTop: 1 }}>
                      <span
                        className={`dot dot-${o.status === 'cooking' ? 'cooking' : o.status === 'ready' ? 'ready' : 'queue'}`}
                        style={{ marginRight: 6 }}
                      />
                      {o.status === 'cooking'
                        ? 'preparando'
                        : o.status === 'ready'
                          ? 'pronto ✓'
                          : 'na fila'}
                    </div>
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const H_History = () => {
  const { state, dispatch } = useStore();
  const sub = state.orders.flatMap((o) => o.items).reduce((s, c) => s + c.qty * c.item.price, 0);
  const taxa = state.taxOn ? Math.round(sub * 0.1) : 0;
  return (
    <div
      className="fade-up"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 22px 18px',
      }}
    >
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 className="display" style={{ fontSize: 24, margin: 0 }}>
          pedidos da mesa
        </h2>
        <span className="mono">{state.orders.length} pedido(s)</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {state.orders.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            nenhum pedido ainda ·{' '}
            <button
              onClick={() => dispatch({ type: 'goto', view: 'menu' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--terracotta)',
                cursor: 'pointer',
                fontSize: 13,
                padding: 0,
              }}
            >
              fazer um?
            </button>
          </div>
        ) : (
          <div className="col" style={{ gap: 8 }}>
            {state.orders.map((o) => {
              const total = o.items.reduce((s, c) => s + c.qty * c.item.price, 0);
              return (
                <div
                  key={o.id}
                  className="card"
                  style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span
                    className={`dot dot-${o.status === 'cooking' ? 'cooking' : o.status === 'ready' ? 'ready' : 'queue'}`}
                  />
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="mono">#{o.id.slice(-4)}</span>
                      <span
                        className={`tag ${o.status === 'cooking' ? 'tag-gold' : o.status === 'ready' ? 'tag-olive' : ''}`}
                        style={{ fontSize: 10 }}
                      >
                        {o.kind === 'cozinha' ? 'cozinha' : 'garçom'} ·{' '}
                        {o.status === 'cooking'
                          ? 'preparando'
                          : o.status === 'ready'
                            ? 'pronto'
                            : 'na fila'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {o.items.map((c) => `${c.qty}× ${c.item.name}`).join(', ')}
                    </div>
                  </div>
                  <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>
                    R$ {total}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div
        className="card-flat"
        style={{ padding: 14, marginTop: 12, background: 'var(--cream-2)' }}
      >
        <div className="row between" style={{ fontSize: 14 }}>
          <span style={{ color: 'var(--ink-2)' }}>subtotal</span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
            R$ {sub}
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: 'toggleTax' })}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            padding: '6px 0',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="row" style={{ gap: 8, fontSize: 14, color: 'var(--ink-2)' }}>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                background: state.taxOn ? 'var(--ink)' : 'transparent',
                border: '1.5px solid var(--ink)',
                color: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
              }}
            >
              {state.taxOn ? '✓' : ''}
            </span>
            serviço 10% (opcional)
          </span>
          <span className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>
            R$ {taxa}
          </span>
        </button>
        <div
          className="row between"
          style={{ borderTop: '1px solid var(--cream-3)', paddingTop: 8, marginTop: 4 }}
        >
          <span className="display" style={{ fontSize: 18, fontWeight: 600 }}>
            total
          </span>
          <span className="display" style={{ fontSize: 24, fontWeight: 700 }}>
            R$ {sub + taxa}
          </span>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 10, gap: 8 }}>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'goto', view: 'menu' })}>
          + pedir
        </button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn">dividir</button>
          <button className="btn btn-primary">pedir conta</button>
        </div>
      </div>
    </div>
  );
};

const H_Waiter = () => {
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
      dispatch({ type: 'callWaiter', reason: 'chamado da mesa' });
      setDragX(0);
    }
  };
  const onPointerUp = () => {
    draggingRef.current = false;
    setDragX(0);
  };

  return (
    <div
      className="fade-up"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 56 }} className={just ? 'bell-shake' : ''}>
        🛎
      </div>
      <h2 className="display" style={{ fontSize: 28, margin: 0, textAlign: 'center' }}>
        {just ? (
          'a caminho!'
        ) : (
          <>
            <span className="display-italic">arraste</span> para chamar
          </>
        )}
      </h2>
      {!just && (
        <div
          ref={trackRef}
          style={{ position: 'relative', width: 380, height: 64 }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--cream-2)',
              borderRadius: 'var(--r-pill)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 24,
              color: 'var(--ink-3)',
              fontSize: 14,
            }}
          >
            solta aqui →
          </div>
          <div
            onPointerDown={onPointerDown}
            style={{
              position: 'absolute',
              top: -3,
              left: dragX,
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'var(--terracotta)',
              color: '#fff8ec',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              boxShadow: '0 4px 16px rgba(193, 74, 38, 0.4)',
              cursor: 'grab',
              touchAction: 'none',
              transition: draggingRef.current ? 'none' : 'left .2s',
            }}
          >
            🛎
          </div>
        </div>
      )}
      {just ? (
        <div
          className="card"
          style={{
            padding: '16px 22px',
            background: 'var(--cream-2)',
            borderColor: 'var(--olive)',
            borderWidth: 2,
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--olive)',
              color: '#fbfaee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✓
          </div>
          <div>
            <div className="display" style={{ fontSize: 18, fontWeight: 600 }}>
              garçom Tiago a caminho
            </div>
            <div className="mono">~2 min · pedido visualizado</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', maxWidth: 320, textAlign: 'center' }}>
          o gesto evita chamados acidentais. o garçom recebe na hora no app dele.
        </div>
      )}
      <button
        className="btn btn-ghost"
        onClick={() =>
          dispatch({
            type: 'goto',
            view: state.cart.length ? 'cart' : state.orders.length ? 'history' : 'menu',
          })
        }
      >
        ← voltar
      </button>
    </div>
  );
};

const H_ReadyOverlay = () => {
  const { state, dispatch } = useStore();
  const order = state.orders.find((o) => o.id === state.ready);
  if (!order) return null;
  const itemNames = order.items.map((c) => c.item.name).join(' + ');
  return (
    <div
      className="fade-up"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: 'rgba(43, 27, 16, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="card"
        style={{
          width: 440,
          padding: 28,
          textAlign: 'center',
          background: 'linear-gradient(180deg, #fffaf0, var(--cream-2))',
          border: '2px solid var(--olive)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 56 }} className="bell-shake">
          🛎
        </div>
        <h1 className="display" style={{ fontSize: 40, margin: 0, lineHeight: 1 }}>
          <span className="display-italic">tá</span> pronto!
        </h1>
        <div className="tag tag-olive" style={{ fontSize: 12 }}>
          pedido #{order.id.slice(-4)}
        </div>
        <div style={{ fontSize: 15, color: 'var(--ink-2)', maxWidth: 340, lineHeight: 1.4 }}>
          <strong>{itemNames}</strong>{' '}
          {order.kind === 'cozinha' ? 'saiu do forno · em instantes na mesa.' : 'tá indo pra mesa.'}
        </div>
        <button
          className="btn btn-ready btn-lg"
          style={{ marginTop: 6, minWidth: 200 }}
          onClick={() => dispatch({ type: 'closeReady' })}
        >
          obrigado!
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { HiFiTotem });
