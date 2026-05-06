// Final selected variations with the user's requested tweaks applied.
// These are NEW components prefixed with `Sel_` so the originals stay
// available for reference in the canvas.

// 01 · Welcome — Opção B (sem contagem de pessoas — already removed in source)
const Sel_Welcome = () => <Welcome_B />;

// 02 · Menu — Opção B
const Sel_Menu = () => <Menu_B />;

// 03 · Detail — Opção B + Adicionais + Remover sabor
const Sel_Detail = () => (
  <Tablet>
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="row between">
        <span className="wf-mono">← voltar</span>
        <div className="wf-h2">monte sua pizza</div>
        <span className="wf-mono">3/4 sabores</span>
      </div>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <svg width="200" height="200" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="var(--paper-2)"
              stroke="var(--line)"
              strokeWidth="1.5"
            />
            <line
              x1="50"
              y1="4"
              x2="50"
              y2="96"
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <line
              x1="4"
              y1="50"
              x2="96"
              y2="50"
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text x="28" y="32" fontSize="6" fontFamily="var(--hand)">
              calabresa
            </text>
            <text x="58" y="32" fontSize="6" fontFamily="var(--hand)">
              marg.
            </text>
            <text x="22" y="72" fontSize="6" fontFamily="var(--hand)">
              portuguesa
            </text>
            <text x="62" y="72" fontSize="6" fontFamily="var(--hand)" fill="var(--ink-3)">
              + sabor
            </text>
            <circle
              cx="75"
              cy="68"
              r="5"
              fill="var(--accent-soft)"
              stroke="var(--accent)"
              strokeWidth="1"
              strokeDasharray="1 1"
            />
            <text x="71" y="71" fontSize="6" fontFamily="var(--hand)" fill="var(--accent)">
              +
            </text>
          </svg>
        </div>
        <div className="grow col" style={{ gap: 6 }}>
          <div className="wf-mono">SABORES</div>
          {['calabresa', 'margherita', 'portuguesa'].map((s) => (
            <div
              key={s}
              className="row between wf-box"
              style={{ padding: '5px 10px', fontSize: 12 }}
            >
              <span>· {s}</span>
              <span className="wf-tiny" style={{ color: 'var(--alert)', cursor: 'pointer' }}>
                remover ×
              </span>
            </div>
          ))}
          <div className="wf-tiny">preço pelo sabor mais caro · R$ 78</div>
        </div>
      </div>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start', marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <div className="wf-mono" style={{ marginBottom: 4 }}>
            BORDA
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {['tradicional', 'catupiry +6', 'cheddar +6'].map((s, i) => (
              <div
                key={s}
                className={`wf-pill${i === 1 ? ' active' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1.2 }}>
          <div className="wf-mono" style={{ marginBottom: 4 }}>
            ADICIONAIS
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 4, fontSize: 11 }}>
            {[
              ['+ bacon', '+R$5', true],
              ['+ catupiry', '+R$4', false],
              ['+ azeitona', '+R$2', false],
              ['+ cebola', '+R$2', true],
            ].map(([n, p, on]) => (
              <div
                key={n}
                className={`wf-pill${on ? ' accent' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                {on ? '✓' : '+'} {n}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 'auto' }}>
        <div className="wf-tiny">borda catupiry · grande · +bacon +cebola</div>
        <div className="row" style={{ gap: 6 }}>
          <div className="wf-btn" style={{ width: 32, padding: 0, fontSize: 14 }}>
            −
          </div>
          <span className="wf-h3" style={{ minWidth: 18, textAlign: 'center' }}>
            1
          </span>
          <div className="wf-btn" style={{ width: 32, padding: 0, fontSize: 14 }}>
            +
          </div>
          <div className="wf-btn primary" style={{ marginLeft: 8 }}>
            add R$ 91
          </div>
        </div>
      </div>
    </div>
  </Tablet>
);

// 04 · Cart — Opção A com edit por item
const Sel_Cart = () => (
  <Tablet>
    <div
      style={{
        paddingTop: 22,
        padding: 16,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="wf-h2">seu pedido · mesa 07</div>
      <div className="col" style={{ gap: 6, flex: 1 }}>
        {[
          { n: 'pizza calabresa grande', mod: 'borda catupiry, +bacon', q: 1, p: 78 },
          { n: 'hamb. cheddar bacon', mod: 'sem cebola', q: 2, p: 42 },
          { n: 'guaraná 600ml', mod: '', q: 2, p: 9 },
        ].map((it, i) => (
          <div key={i} className="wf-box row" style={{ padding: 10, gap: 10 }}>
            <div className="wf-photo" style={{ width: 50, height: 40, fontSize: 9 }}>
              foto
            </div>
            <div className="grow">
              <div style={{ fontSize: 14 }}>{it.n}</div>
              {it.mod && <div className="wf-tiny">{it.mod}</div>}
              <div className="row" style={{ gap: 8, marginTop: 4 }}>
                <span className="wf-tiny" style={{ color: 'var(--accent)', cursor: 'pointer' }}>
                  ✏ editar
                </span>
                <span className="wf-tiny" style={{ color: 'var(--alert)', cursor: 'pointer' }}>
                  × remover
                </span>
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="wf-pill" style={{ padding: '2px 8px', fontSize: 12 }}>
                −
              </span>
              <span style={{ fontFamily: 'var(--display)' }}>{it.q}</span>
              <span className="wf-pill" style={{ padding: '2px 8px', fontSize: 12 }}>
                +
              </span>
            </div>
            <div className="wf-mono" style={{ width: 56, textAlign: 'right' }}>
              R$ {it.p * it.q}
            </div>
          </div>
        ))}
      </div>
      <div className="wf-box fill" style={{ padding: 10 }}>
        <div className="row between">
          <span>subtotal</span>
          <span className="wf-mono">R$ 180</span>
        </div>
        <div className="row between">
          <span>serviço 10%</span>
          <span className="wf-mono">R$ 18</span>
        </div>
        <div
          className="row between"
          style={{ marginTop: 4, fontSize: 18, fontFamily: 'var(--display)' }}
        >
          <span>total</span>
          <span>R$ 198,00</span>
        </div>
      </div>
      <div className="row between">
        <div className="wf-btn ghost">+ add mais itens</div>
        <div className="wf-btn primary" style={{ fontSize: 16 }}>
          enviar pedido →
        </div>
      </div>
    </div>
  </Tablet>
);

// 05 · Confirm — Opção A
const Sel_Confirm = () => <Confirm_A />;

// 06 · Timer — Opção A com múltiplas pizzas em preparo
const Sel_Timer = ({ pct = 0.55, time = '08:24' }) => (
  <Tablet>
    <div style={{ paddingTop: 22, height: '100%', padding: 20, display: 'flex', gap: 20 }}>
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
        <div className="wf-mono">PRÓXIMA · pizza calabresa G</div>
        <ProgRing size={170} pct={pct} label={time} sub="min restantes" />
        <Scribble w={120} />
        <div className="row" style={{ gap: 8, marginTop: 4 }}>
          {[
            { n: 'calabresa G', pct: pct, time, big: true },
            { n: 'margherita M', pct: 0.3, time: '12:10' },
            { n: 'portuguesa G', pct: 0.85, time: '02:40' },
          ].map((p, i) => (
            <div
              key={i}
              className="wf-box"
              style={{
                padding: 6,
                textAlign: 'center',
                minWidth: 70,
                borderColor: p.big ? 'var(--accent)' : 'var(--line)',
                borderWidth: p.big ? 2 : 1.5,
                background: p.big ? 'var(--accent-soft)' : 'var(--paper)',
              }}
            >
              <ProgRing size={36} pct={p.pct} label="" />
              <div className="wf-tiny" style={{ marginTop: 2 }}>
                {p.n}
              </div>
              <div className="wf-mono" style={{ fontSize: 10 }}>
                {p.time}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        <div className="wf-mono">SEU PEDIDO · 6 itens</div>
        <div className="col" style={{ gap: 5, fontSize: 12 }}>
          <div className="row between wf-box" style={{ padding: 7 }}>
            <span>· pizza calabresa G</span>
            <span className="wf-pill accent" style={{ fontSize: 10, padding: '1px 7px' }}>
              preparando
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 7 }}>
            <span>· pizza margherita M</span>
            <span className="wf-pill accent" style={{ fontSize: 10, padding: '1px 7px' }}>
              preparando
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 7 }}>
            <span>· pizza portuguesa G</span>
            <span className="wf-pill accent" style={{ fontSize: 10, padding: '1px 7px' }}>
              quase
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 7 }}>
            <span>· hamb. cheddar ×2</span>
            <span className="wf-pill" style={{ fontSize: 10, padding: '1px 7px' }}>
              na fila
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 7 }}>
            <span>· guaraná ×2</span>
            <span className="wf-pill ready" style={{ fontSize: 10, padding: '1px 7px' }}>
              servido ✓
            </span>
          </div>
        </div>
        <div className="wf-btn ghost" style={{ marginTop: 8, fontSize: 13 }}>
          + pedir mais (sem perder timer)
        </div>
      </div>
    </div>
    <CallWaiter style={{ bottom: 14, right: 14 }} />
  </Tablet>
);

// 07 · Mini timer — Opção A
const Sel_Mini = () => <Mini_A />;

// 08 · Ready — Opção A como camada/overlay sobre o cardápio, com "ok, voltar"
const Sel_Ready = () => (
  <Tablet>
    {/* Background: menu being browsed */}
    <div style={{ paddingTop: 22, opacity: 0.5, filter: 'blur(0.5px)' }}>
      <TabBar tabs={['pizzas', 'lanches', 'bebidas', 'sobremesas']} active={1} />
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <MenuCard key={i} name={`item ${i + 1}`} price={`R$ ${20 + i * 3}`} w="100%" h={70} />
        ))}
      </div>
    </div>
    {/* Dim layer */}
    <div
      style={{
        position: 'absolute',
        inset: 22,
        background: 'rgba(26,23,20,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Card overlay */}
      <div
        className="wf-box wobble"
        style={{
          width: 460,
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
        <div style={{ fontSize: 60, animation: 'wiggle 1s infinite' }}>🛎️</div>
        <div className="wf-h1" style={{ fontSize: 44 }}>
          tá pronto!
        </div>
        <Scribble w={140} color="var(--ready)" />
        <div style={{ fontSize: 15, textAlign: 'center', maxWidth: 340 }}>
          a pizza calabresa saiu do forno.
          <br />o garçom já tá a caminho da mesa.
        </div>
        <div className="wf-tiny">fecha em 8s · você volta pro cardápio</div>
        <div className="row" style={{ marginTop: 6, gap: 8 }}>
          <div className="wf-btn ghost" style={{ fontSize: 13 }}>
            silenciar 🔕
          </div>
          <div className="wf-btn ready">ok, voltar →</div>
        </div>
      </div>
    </div>
    <Annotate style={{ top: 50, left: 18, color: 'var(--paper)' }}>
      ↑ overlay sobre onde estava · ok = volta
    </Annotate>
    <style>{`@keyframes wiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }`}</style>
  </Tablet>
);

// 09 · Chamar garçom — Opção C swipe + aviso/ETA da B
const Sel_Waiter = () => (
  <Tablet>
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 24,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div className="wf-h2">arrasta o sino pra chamar →</div>
      <Scribble w={140} />
      <div style={{ position: 'relative', width: 360, height: 100 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 70,
            transform: 'translateY(-50%)',
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
          style={{
            position: 'absolute',
            top: '50%',
            left: 8,
            transform: 'translateY(-50%)',
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: 'var(--paper)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            boxShadow: '4px 4px 0 var(--line)',
            border: '2px solid var(--line)',
          }}
        >
          🛎
        </div>
      </div>
      {/* Confirmation panel (post-call state) */}
      <div
        className="wf-box"
        style={{
          padding: '10px 16px',
          marginTop: 6,
          background: 'var(--accent-soft)',
          borderColor: 'var(--accent)',
          borderWidth: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22 }}>✓</span>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 16 }}>a caminho!</div>
          <div className="wf-tiny">
            <span className="dot preparing" /> garçom <strong>Tiago</strong> vendo · em geral ~2 min
          </div>
        </div>
        <div className="wf-btn ghost" style={{ fontSize: 11, padding: '3px 8px' }}>
          cancelar
        </div>
      </div>
      <div className="wf-tiny" style={{ marginTop: 4 }}>
        swipe-to-call evita chamado por toque acidental
      </div>
    </div>
  </Tablet>
);

// 10 · History — Opção A com toggle de taxa 10% (default ligado) + dividir conta
const Sel_History = () => (
  <Tablet>
    <div style={{ paddingTop: 22, padding: 16 }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="wf-h2">pedidos da mesa 07</span>
        <span className="wf-mono">aberta há 1h22</span>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {[
          {
            n: '#2849',
            t: 'agora · em preparo',
            items: 'pizza calabresa, hamb. cheddar',
            total: 162,
            st: 'preparing',
          },
          { n: '#2848', t: '20:10 · pronto', items: 'guaraná ×2, água', total: 27, st: 'ready' },
          {
            n: '#2847',
            t: '19:50 · entregue',
            items: 'porção de fritas, bruschetta',
            total: 38,
            st: 'done',
          },
        ].map((p, i) => (
          <div key={i} className="wf-box row" style={{ padding: 10, gap: 12 }}>
            <span
              className={`dot ${p.st === 'preparing' ? 'preparing' : p.st === 'ready' ? 'ready' : 'waiting'}`}
            />
            <div className="grow">
              <div className="row" style={{ gap: 10 }}>
                <span className="wf-mono">{p.n}</span>
                <span className="wf-tiny">{p.t}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{p.items}</div>
            </div>
            <span className="wf-mono">R$ {p.total}</span>
            <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>›</span>
          </div>
        ))}
      </div>
      <div className="wf-box fill" style={{ padding: 10, marginTop: 14 }}>
        <div className="row between">
          <span>subtotal</span>
          <span className="wf-mono">R$ 227,00</span>
        </div>
        <div className="row between" style={{ marginTop: 4 }}>
          <span className="row" style={{ gap: 8 }}>
            <span
              className="wf-pill"
              style={{
                padding: '0 6px',
                background: 'var(--line)',
                color: 'var(--paper)',
                border: '1.5px solid var(--line)',
                fontSize: 11,
                minWidth: 18,
                justifyContent: 'center',
              }}
            >
              ✓
            </span>
            serviço 10% (opcional)
          </span>
          <span className="wf-mono">R$ 22,70</span>
        </div>
        <div
          className="row between"
          style={{ marginTop: 6, fontSize: 18, fontFamily: 'var(--display)' }}
        >
          <span>total</span>
          <span>R$ 249,70</span>
        </div>
        <div className="wf-tiny" style={{ marginTop: 2 }}>
          desmarque pra remover a taxa
        </div>
      </div>
      <div className="row between" style={{ marginTop: 12 }}>
        <div className="wf-btn ghost">+ novo pedido</div>
        <div className="wf-btn">dividir conta</div>
        <div className="wf-btn primary">pedir conta</div>
      </div>
    </div>
  </Tablet>
);

// KDS · Opção A — pass through
const Sel_KDS = () => <KDS_A />;

// Garçom · Opção A — pass through
const Sel_Garcom = () => <Garcom_A />;

Object.assign(window, {
  Sel_Welcome,
  Sel_Menu,
  Sel_Detail,
  Sel_Cart,
  Sel_Confirm,
  Sel_Timer,
  Sel_Mini,
  Sel_Ready,
  Sel_Waiter,
  Sel_History,
  Sel_KDS,
  Sel_Garcom,
});
