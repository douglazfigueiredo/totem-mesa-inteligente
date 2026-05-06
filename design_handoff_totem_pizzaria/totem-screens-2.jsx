// Totem timer screens — 06 timer ativo full, 07 timer minimizado, 08 pronto, 09 chamar garçom, 10 histórico

// ─────────────────────────────────────────────
// 06 · Timer ativo (full)
// ─────────────────────────────────────────────
const Timer_A = ({ pct = 0.55, time = '08:24' }) => (
  <Tablet>
    <div style={{ paddingTop: 22, height: '100%', padding: 24, display: 'flex', gap: 24 }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div className="wf-mono">PREPARANDO · pizza calabresa G</div>
        <ProgRing size={220} pct={pct} label={time} sub="min restantes" />
        <Scribble w={140} />
        <div className="wf-tiny">a cozinha começou às 20:18</div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          justifyContent: 'center',
        }}
      >
        <div className="wf-mono">SEU PEDIDO</div>
        <div className="col" style={{ gap: 6, fontSize: 13 }}>
          <div className="row between wf-box" style={{ padding: 8 }}>
            <span>· pizza calabresa G</span>
            <span className="wf-pill accent" style={{ fontSize: 11, padding: '2px 8px' }}>
              preparando
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 8 }}>
            <span>· hamb. cheddar ×2</span>
            <span className="wf-pill" style={{ fontSize: 11, padding: '2px 8px' }}>
              na fila
            </span>
          </div>
          <div className="row between wf-box" style={{ padding: 8 }}>
            <span>· guaraná ×2</span>
            <span className="wf-pill ready" style={{ fontSize: 11, padding: '2px 8px' }}>
              servido ✓
            </span>
          </div>
        </div>
        <div className="wf-btn ghost" style={{ marginTop: 12, fontSize: 14 }}>
          + pedir mais (sem perder o timer)
        </div>
      </div>
    </div>
    <CallWaiter style={{ bottom: 14, right: 14 }} />
  </Tablet>
);

const Timer_B = ({ pct = 0.55, time = '08:24' }) => (
  <Tablet>
    {/* Pizza-baking illustration as the hero timer */}
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ flex: 1.2, textAlign: 'center' }}>
        <div className="wf-mono">SUA PIZZA TÁ NO FORNO</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <PizzaBake size={180} pct={pct} />
        </div>
        <div className="wf-h1" style={{ fontSize: 56, marginTop: 4 }}>
          {time}
        </div>
        <div className="wf-tiny">tempo restante</div>
        <Bar pct={pct} h={12} />
      </div>
      <div style={{ flex: 1, padding: 14, borderLeft: '1.5px dashed var(--line)' }}>
        <div className="wf-mono">ETAPAS</div>
        <div className="col" style={{ gap: 8, marginTop: 8, fontSize: 13 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ color: 'var(--ready)' }}>✓</span> recebido
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ color: 'var(--ready)' }}>✓</span> massa aberta
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ color: 'var(--accent)' }}>●</span> <strong>no forno</strong>
          </div>
          <div className="row" style={{ gap: 8, color: 'var(--ink-3)' }}>
            <span>○</span> finalizando
          </div>
          <div className="row" style={{ gap: 8, color: 'var(--ink-3)' }}>
            <span>○</span> pronta na mesa
          </div>
        </div>
        <div className="wf-btn" style={{ marginTop: 14, fontSize: 13 }}>
          continuar pedindo →
        </div>
      </div>
    </div>
  </Tablet>
);

const Timer_C = ({ pct = 0.55, time = '08:24' }) => (
  <Tablet>
    {/* Risky: timeline view with multiple parallel timers */}
    <div style={{ paddingTop: 22, height: '100%', padding: 20 }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <span className="wf-h2">acompanhar pedido</span>
        <span className="wf-mono">3 itens em preparo</span>
      </div>
      <div className="col" style={{ gap: 10 }}>
        {[
          { n: 'pizza calabresa G', pct: pct, time, color: 'var(--accent)', status: 'no forno' },
          {
            n: 'hamb. cheddar ×2',
            pct: 0.3,
            time: '12:10',
            color: 'var(--accent)',
            status: 'na chapa',
          },
          { n: 'brownie', pct: 0.95, time: '00:30', color: 'var(--ready)', status: 'quase' },
        ].map((it, i) => (
          <div key={i} className="wf-box" style={{ padding: 10 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{it.n}</span>
              <div className="row" style={{ gap: 10 }}>
                <span
                  className="wf-pill"
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderColor: it.color,
                    color: it.color,
                  }}
                >
                  {it.status}
                </span>
                <span className="wf-mono" style={{ fontSize: 16, color: it.color }}>
                  {it.time}
                </span>
              </div>
            </div>
            <Bar pct={it.pct} h={8} color={it.color} />
          </div>
        ))}
        <div className="wf-box" style={{ padding: 10, opacity: 0.5, borderStyle: 'dashed' }}>
          <div className="row between">
            <span style={{ fontSize: 14 }}>2× guaraná 600ml</span>
            <span className="wf-pill ready" style={{ fontSize: 11, padding: '2px 8px' }}>
              já chegou ✓
            </span>
          </div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 14 }}>
        <Annotate style={{ position: 'static' }}>
          cada item tem seu próprio timer · em paralelo
        </Annotate>
        <div className="wf-btn ghost" style={{ fontSize: 13 }}>
          continuar pedindo →
        </div>
      </div>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 07 · Timer minimizado (widget flutuante)
// ─────────────────────────────────────────────
// Shows the menu/cart in background + minimized timer in some position
const Mini_A = () => (
  <Tablet>
    {/* Bottom-right pill */}
    <div style={{ paddingTop: 22, opacity: 0.6 }}>
      <TabBar tabs={['pizzas', 'lanches', 'bebidas', 'sobremesas']} active={1} />
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <MenuCard key={i} name={`item ${i + 1}`} price={`R$ ${20 + i * 3}`} w="100%" h={86} />
        ))}
      </div>
    </div>
    <MiniTimer style={{ bottom: 24, right: 16 }} pct={0.55} time="08:24" label="🍕 calabresa" />
    <Annotate style={{ bottom: 70, right: 130, color: 'var(--accent)' }}>
      ↘ sempre visível, toca pra expandir
    </Annotate>
  </Tablet>
);

const Mini_B = () => (
  <Tablet>
    {/* Top sticky bar */}
    <div style={{ paddingTop: 22 }}>
      <div
        style={{
          background: 'var(--accent-soft)',
          borderBottom: '2px solid var(--accent)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <PizzaBake size={32} pct={0.55} />
        <div className="grow">
          <div className="wf-mono">tá no forno · pizza calabresa</div>
          <Bar pct={0.55} h={6} />
        </div>
        <div className="wf-h2" style={{ fontSize: 22 }}>
          08:24
        </div>
        <span className="wf-tiny">↑ expandir</span>
      </div>
      <TabBar tabs={['pizzas', 'lanches', 'bebidas', 'sobremesas']} active={1} />
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <MenuCard key={i} name={`item ${i + 1}`} price={`R$ ${20 + i * 3}`} w="100%" h={70} />
        ))}
      </div>
    </div>
    <Annotate style={{ top: 60, left: 140, color: 'var(--accent)' }}>
      ↑ banner topo, não cobre conteúdo
    </Annotate>
  </Tablet>
);

const Mini_C = () => (
  <Tablet>
    {/* Risky: side dock with 3 parallel mini-timers */}
    <div style={{ paddingTop: 22, display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, opacity: 0.5 }}>
        <TabBar tabs={['pizzas', 'lanches', 'bebidas']} active={0} />
        <div
          style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <MenuCard key={i} name={`item ${i + 1}`} price={`R$ ${20 + i * 3}`} w="100%" h={90} />
          ))}
        </div>
      </div>
      <div
        style={{
          width: 130,
          borderLeft: '2px solid var(--line)',
          background: 'var(--paper-2)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div className="wf-mono" style={{ fontSize: 9 }}>
          EM PREPARO
        </div>
        {[
          { n: 'calabresa', pct: 0.55, time: '8:24', c: 'var(--accent)' },
          { n: 'cheddar ×2', pct: 0.3, time: '12:10', c: 'var(--accent)' },
          { n: 'brownie', pct: 0.95, time: '0:30', c: 'var(--ready)' },
        ].map((t, i) => (
          <div key={i} className="wf-box" style={{ padding: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ProgRing size={50} pct={t.pct} color={t.c} label={t.time.split(':')[0]} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 2 }}>{t.n}</div>
          </div>
        ))}
        <div className="wf-btn ghost" style={{ fontSize: 11, padding: '4px 6px' }}>
          ↗ expandir
        </div>
      </div>
    </div>
    <Annotate style={{ top: 80, right: 140, color: 'var(--accent)' }}>
      ↘ dock lateral · 3 timers paralelos
    </Annotate>
  </Tablet>
);

// ─────────────────────────────────────────────
// 08 · Pronto (com sino)
// ─────────────────────────────────────────────
const Ready_A = () => (
  <Tablet>
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 30,
        background: 'var(--ready-soft)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div style={{ fontSize: 80, animation: 'wiggle 1s infinite' }}>🛎️</div>
      <div className="wf-h1" style={{ fontSize: 60, color: 'var(--ink)' }}>
        tá pronto!
      </div>
      <Scribble w={180} color="var(--ready)" />
      <div style={{ fontSize: 18, textAlign: 'center' }}>
        a pizza calabresa saiu do forno.
        <br />
        tá indo pra mesa em segundos.
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <div className="wf-btn ghost">silenciar 🔕</div>
        <div className="wf-btn ready">ok, tô vendo!</div>
      </div>
    </div>
    <style>{`@keyframes wiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }`}</style>
  </Tablet>
);

const Ready_B = () => (
  <Tablet>
    {/* Toast at top while menu still browsable */}
    <div style={{ paddingTop: 22 }}>
      <div
        style={{
          margin: '8px 14px',
          padding: '10px 14px',
          background: 'var(--ready-soft)',
          border: '2px solid var(--ready)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '3px 3px 0 var(--ready)',
        }}
      >
        <span style={{ fontSize: 28 }}>🛎️</span>
        <div className="grow">
          <div style={{ fontFamily: 'var(--display)', fontSize: 20 }}>pizza calabresa pronta!</div>
          <div className="wf-tiny">o garçom já tá levando</div>
        </div>
        <div className="wf-btn ready" style={{ fontSize: 13 }}>
          ok!
        </div>
        <span style={{ fontSize: 16 }}>×</span>
      </div>
      <TabBar tabs={['pizzas', 'lanches', 'bebidas', 'sobremesas']} active={2} />
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <MenuCard key={i} name={`item ${i + 1}`} price={`R$ ${20 + i * 3}`} w="100%" h={70} />
        ))}
      </div>
    </div>
    <Annotate style={{ top: 100, right: 18, color: 'var(--ready)' }}>
      ↑ toast — não interrompe quem tá pedindo
    </Annotate>
  </Tablet>
);

const Ready_C = () => (
  <Tablet>
    {/* Risky: full-screen confetti takeover with auto-dismiss */}
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `repeating-conic-gradient(from 0deg at 50% 50%, var(--paper) 0deg 30deg, var(--ready-soft) 30deg 60deg)`,
        backgroundSize: '40px 40px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(250,250,246,0.8)',
        }}
      >
        <div className="wf-h1" style={{ fontSize: 92, lineHeight: 1 }}>
          PRONTO!
        </div>
        <div style={{ fontSize: 60, marginTop: 8 }}>🍕 🛎 🎉</div>
        <Scribble w={200} color="var(--ready)" />
        <div style={{ fontSize: 16, marginTop: 12 }}>pizza calabresa · saiu do forno agora</div>
        <div className="wf-mono" style={{ marginTop: 18, color: 'var(--ink-3)' }}>
          fecha sozinho em 5s · ou toque pra ver
        </div>
        <div className="row" style={{ marginTop: 12, position: 'absolute', bottom: 20 }}>
          <span className="wf-tiny">próximo: hamb cheddar · 4 min</span>
        </div>
      </div>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 09 · Chamar garçom
// ─────────────────────────────────────────────
const Waiter_A = () => (
  <Tablet>
    {/* Modal with reasons */}
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 30,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="wf-box wobble"
        style={{
          width: 460,
          padding: 22,
          background: 'var(--paper)',
          boxShadow: '6px 6px 0 var(--line)',
        }}
      >
        <div className="wf-h2">precisa de algo?</div>
        <Scribble w={100} />
        <div className="wf-tiny" style={{ marginTop: 4 }}>
          diz pro garçom o que rolou — ele já sabe a mesa
        </div>
        <div className="col" style={{ gap: 8, marginTop: 14 }}>
          {[
            ['🍴', 'mais talheres / guardanapo'],
            ['🥤', 'pedido pra recargar bebida'],
            ['❓', 'tirar uma dúvida'],
            ['🧾', 'fechar a conta'],
            ['💬', 'outro motivo (digitar)'],
          ].map(([e, t]) => (
            <div key={t} className="wf-btn" style={{ justifyContent: 'flex-start', fontSize: 15 }}>
              <span style={{ fontSize: 18 }}>{e}</span> {t}
            </div>
          ))}
        </div>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <div className="wf-btn ghost">cancelar</div>
        </div>
      </div>
    </div>
  </Tablet>
);

const Waiter_B = () => (
  <Tablet>
    {/* Fullscreen "called" confirmation */}
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 80 }}>🛎️</div>
      <div className="wf-h1">a caminho!</div>
      <Scribble w={140} />
      <div style={{ fontSize: 16, textAlign: 'center', maxWidth: 380 }}>
        avisamos o garçom — em geral <strong>2 minutos</strong>. se for muito urgente, balança pra
        alguém ali.
      </div>
      <div className="wf-box" style={{ padding: '8px 14px', marginTop: 8, fontSize: 13 }}>
        <span className="dot preparing" /> garçom: <strong>Tiago</strong> · vendo o chamado
      </div>
      <div className="wf-btn ghost" style={{ marginTop: 8 }}>
        cancelar chamado
      </div>
    </div>
  </Tablet>
);

const Waiter_C = () => (
  <Tablet>
    {/* Risky: physical metaphor — drag the bell */}
    <div
      style={{
        paddingTop: 22,
        height: '100%',
        padding: 30,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <div className="wf-h2">arrasta o sino pra chamar →</div>
      <Scribble w={140} />
      <div style={{ position: 'relative', width: 360, height: 180 }}>
        {/* track */}
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
        {/* bell */}
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
      <div className="wf-tiny">evita chamado por toque acidental — precisa intenção</div>
      <Annotate style={{ bottom: 24, right: 30 }}>swipe-to-call · sem pop-up sumido</Annotate>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 10 · Pedidos múltiplos / histórico da mesa
// ─────────────────────────────────────────────
const History_A = () => (
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
        <div className="row between" style={{ fontSize: 18, fontFamily: 'var(--display)' }}>
          <span>total da mesa</span>
          <span>R$ 227,00</span>
        </div>
        <div className="wf-tiny">+ serviço 10% no fechamento</div>
      </div>
      <div className="row between" style={{ marginTop: 12 }}>
        <div className="wf-btn ghost">+ novo pedido</div>
        <div className="wf-btn">dividir conta</div>
        <div className="wf-btn primary">pedir conta</div>
      </div>
    </div>
  </Tablet>
);

const History_B = () => (
  <Tablet>
    {/* Per-person tabs */}
    <div style={{ paddingTop: 22, padding: 16 }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="wf-h2">mesa 07 · 4 pessoas</span>
        <span className="wf-mono">total R$ 227</span>
      </div>
      <div className="row" style={{ gap: 6, marginBottom: 12 }}>
        {['todos', 'ana', 'bruno', 'carla', 'diego'].map((p, i) => (
          <div key={p} className={`wf-pill${i === 0 ? ' active' : ''}`} style={{ fontSize: 12 }}>
            {p}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { n: 'ana', items: ['pizza calabresa /4', 'guaraná'], total: 26 },
          { n: 'bruno', items: ['pizza calabresa /4', 'hamb. cheddar'], total: 61 },
          { n: 'carla', items: ['pizza calabresa /4', 'guaraná', 'brownie'], total: 42 },
          { n: 'diego', items: ['pizza calabresa /4', 'hamb. cheddar', 'água'], total: 56 },
        ].map((p, i) => (
          <div key={i} className="wf-box" style={{ padding: 10 }}>
            <div className="row between">
              <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>{p.n}</span>
              <span className="wf-mono">R$ {p.total}</span>
            </div>
            <div className="col" style={{ gap: 2, marginTop: 4, fontSize: 12 }}>
              {p.items.map((it, j) => (
                <div key={j}>· {it}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="row between" style={{ marginTop: 12 }}>
        <div className="wf-btn ghost">+ pedir mais</div>
        <div className="wf-btn primary">fechar conta dividida</div>
      </div>
    </div>
  </Tablet>
);

const History_C = () => (
  <Tablet>
    {/* Risky: live activity feed timeline */}
    <div style={{ paddingTop: 22, padding: 16, height: '100%' }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="wf-h2">o que rolou na mesa</span>
        <span className="wf-mono">ao vivo</span>
      </div>
      <div className="col" style={{ gap: 0, position: 'relative', paddingLeft: 16 }}>
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 12,
            bottom: 12,
            width: 1.5,
            background: 'var(--line)',
            opacity: 0.4,
          }}
        />
        {[
          { t: 'agora', txt: '🍕 pizza calabresa começou no forno', c: 'var(--accent)' },
          { t: '20:18', txt: '✓ pedido #2849 enviado pra cozinha', c: 'var(--ink-2)' },
          { t: '20:14', txt: '🛎 garçom Tiago chamado · respondido', c: 'var(--ink-2)' },
          { t: '20:10', txt: '🥤 guaraná ×2 servido', c: 'var(--ready)' },
          { t: '19:55', txt: '✓ pedido #2848 entregue', c: 'var(--ready)' },
          { t: '19:35', txt: '👋 mesa aberta · ana, bruno, carla, diego', c: 'var(--ink-3)' },
        ].map((e, i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '8px 0', position: 'relative' }}>
            <span
              className="dot"
              style={{
                position: 'absolute',
                left: -16,
                top: 14,
                background: e.c,
                width: 9,
                height: 9,
              }}
            />
            <span className="wf-mono" style={{ width: 50, fontSize: 11 }}>
              {e.t}
            </span>
            <span style={{ fontSize: 13 }}>{e.txt}</span>
          </div>
        ))}
      </div>
      <div className="row between" style={{ marginTop: 14, paddingLeft: 16 }}>
        <span className="wf-mono">conta · R$ 227</span>
        <div className="wf-btn primary">fechar mesa</div>
      </div>
    </div>
  </Tablet>
);

Object.assign(window, {
  Timer_A,
  Timer_B,
  Timer_C,
  Mini_A,
  Mini_B,
  Mini_C,
  Ready_A,
  Ready_B,
  Ready_C,
  Waiter_A,
  Waiter_B,
  Waiter_C,
  History_A,
  History_B,
  History_C,
});
