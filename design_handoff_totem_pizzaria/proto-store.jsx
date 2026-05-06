// Shared state store for the prototype — orders, timers, waiter calls.
// All three surfaces read/write the same state.

const StoreCtx = React.createContext(null);

const initialState = {
  // Sample menu — flat list grouped by category
  menu: [
    // tempos shortened to seconds-range so prototype demo runs fast
    { id: 'p1', cat: 'pizzas', name: 'pizza calabresa G', price: 64, kind: 'cozinha', tempo: 25 },
    { id: 'p2', cat: 'pizzas', name: 'pizza margherita G', price: 58, kind: 'cozinha', tempo: 22 },
    { id: 'p3', cat: 'pizzas', name: 'pizza portuguesa G', price: 68, kind: 'cozinha', tempo: 25 },
    { id: 'p4', cat: 'pizzas', name: 'pizza 4 queijos G', price: 72, kind: 'cozinha', tempo: 25 },
    { id: 'l1', cat: 'lanches', name: 'hamb. cheddar bacon', price: 42, kind: 'cozinha', tempo: 18 },
    { id: 'l2', cat: 'lanches', name: 'hamb. duplo', price: 48, kind: 'cozinha', tempo: 20 },
    { id: 'l3', cat: 'lanches', name: 'hamb. veggie', price: 38, kind: 'cozinha', tempo: 15 },
    { id: 'b1', cat: 'bebidas', name: 'guaraná 600ml', price: 9, kind: 'garcom', tempo: 8 },
    { id: 'b2', cat: 'bebidas', name: 'água com gás', price: 6, kind: 'garcom', tempo: 8 },
    { id: 'b3', cat: 'bebidas', name: 'suco laranja', price: 12, kind: 'garcom', tempo: 10 },
    { id: 's1', cat: 'sobremesas', name: 'brownie c/ sorvete', price: 16, kind: 'garcom', tempo: 10 },
  ],
  cart: [], // {id, qty, item}
  orders: [], // {id, items, status, ts, kind}
  prep: {}, // orderId -> { startedAt, duration } per kitchen ticket
  calls: [], // { id, table, reason, ts, status }
  notifications: [], // toasts
  view: 'welcome', // welcome | menu | detail | cart | confirm | timer | history | waiter | ready
  detailItem: null,
  ready: null, // orderId that just became ready (overlay)
  miniTimer: false, // is the timer minimized?
  taxOn: true,
};

function storeReducer(s, a) {
  switch (a.type) {
    case 'goto': return { ...s, view: a.view, detailItem: a.item ?? s.detailItem };
    case 'addToCart': {
      const ex = s.cart.find(c => c.id === a.item.id);
      const cart = ex
        ? s.cart.map(c => c.id === a.item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...s.cart, { id: a.item.id, qty: 1, item: a.item }];
      return { ...s, cart };
    }
    case 'incCart': return { ...s, cart: s.cart.map(c => c.id === a.id ? { ...c, qty: c.qty + 1 } : c) };
    case 'decCart': return { ...s, cart: s.cart.map(c => c.id === a.id ? { ...c, qty: Math.max(0, c.qty - 1) } : c).filter(c => c.qty > 0) };
    case 'removeCart': return { ...s, cart: s.cart.filter(c => c.id !== a.id) };
    case 'sendOrder': {
      const cozinha = s.cart.filter(c => c.item.kind === 'cozinha');
      const garcom  = s.cart.filter(c => c.item.kind === 'garcom');
      const orders = [...s.orders];
      const ts = Date.now();
      if (cozinha.length) orders.push({ id: 'k' + ts, items: cozinha, status: 'queue', ts, kind: 'cozinha' });
      if (garcom.length)  orders.push({ id: 'g' + ts, items: garcom,  status: 'queue', ts, kind: 'garcom' });
      return { ...s, orders, cart: [], view: 'confirm' };
    }
    case 'startPrep': {
      const orders = s.orders.map(o => o.id === a.id ? { ...o, status: 'cooking' } : o);
      const dur = a.duration ?? Math.max(...s.orders.find(o => o.id === a.id).items.map(c => c.item.tempo));
      const prep = { ...s.prep, [a.id]: { startedAt: Date.now(), duration: dur } };
      return { ...s, orders, prep };
    }
    case 'markReady': {
      const orders = s.orders.map(o => o.id === a.id ? { ...o, status: 'ready' } : o);
      return { ...s, orders, ready: a.id, view: s.view === 'timer' ? 'timer' : s.view };
    }
    case 'serveGarcom': {
      const orders = s.orders.map(o => o.id === a.id ? { ...o, status: 'ready' } : o);
      return { ...s, orders, ready: a.id };
    }
    case 'closeReady': return { ...s, ready: null };
    case 'callWaiter': {
      const calls = [...s.calls, { id: 'c'+Date.now(), table: '07', reason: a.reason ?? 'chamado', ts: Date.now(), status: 'pending' }];
      return { ...s, calls };
    }
    case 'ackCall': return { ...s, calls: s.calls.map(c => c.id === a.id ? { ...c, status: 'ack' } : c) };
    case 'minimize': return { ...s, miniTimer: a.value };
    case 'toggleTax': return { ...s, taxOn: !s.taxOn };
    case 'reset': return initialState;
    default: return s;
  }
}

const StoreProvider = ({ children }) => {
  const [state, dispatch] = React.useReducer(storeReducer, initialState);
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
};

const useStore = () => React.useContext(StoreCtx);

// Live tick: 4Hz — drives all timers + detects "ready" transitions
const useTicker = () => {
  const { state, dispatch } = useStore();
  const [, force] = React.useReducer(x => x+1, 0);
  React.useEffect(() => {
    const id = setInterval(() => {
      force();
      // Detect ready transitions
      const now = Date.now();
      Object.entries(state.prep).forEach(([oid, p]) => {
        const order = state.orders.find(o => o.id === oid);
        if (!order) return;
        if (order.status === 'cooking' && (now - p.startedAt) >= p.duration * 1000) {
          dispatch({ type: 'markReady', id: oid });
        }
      });
    }, 250);
    return () => clearInterval(id);
  }, [state.prep, state.orders, dispatch]);
};

// Helper: time remaining on a prep
const remaining = (state, orderId) => {
  const p = state.prep[orderId];
  if (!p) return 0;
  return Math.max(0, p.duration - Math.floor((Date.now() - p.startedAt) / 1000));
};
const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

Object.assign(window, { StoreProvider, StoreCtx, useStore, useTicker, remaining, fmtTime });
