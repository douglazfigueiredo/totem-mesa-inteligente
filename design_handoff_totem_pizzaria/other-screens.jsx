// KDS (cozinha) and Garçom app screens — 3 variations each
// KDS = bigger horizontal display (still 720x500)
// Garçom = smaller phone-y feeling (we'll show as tablet but tighter)

// ─────────────────────────────────────────────
// KDS · Cozinha (Kitchen Display System)
// ─────────────────────────────────────────────

// Order ticket card for KDS
const KDSTicket = ({ table, num, items, time, status = 'queue', mins }) => {
  const colors = {
    queue: { bg: 'var(--paper)', border: 'var(--line)', label: 'aguardando', dot: 'var(--ink-3)' },
    cooking: { bg: 'var(--accent-soft)', border: 'var(--accent)', label: 'preparando', dot: 'var(--accent)' },
    ready: { bg: 'var(--ready-soft)', border: 'var(--ready)', label: 'pronto', dot: 'var(--ready)' },
    late: { bg: '#fde8e3', border: 'var(--alert)', label: 'atrasado', dot: 'var(--alert)' },
  };
  const c = colors[status];
  return (
    <div className="wf-box" style={{
      padding: 8, background: c.bg, borderColor: c.border, borderWidth: 2,
      display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11,
    }}>
      <div className="row between">
        <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>mesa {table}</span>
        <span className="wf-mono">#{num}</span>
      </div>
      <div className="row between" style={{ fontSize: 10 }}>
        <span><span className="dot" style={{background: c.dot}} /> {c.label}</span>
        <span className="wf-mono">{time}</span>
      </div>
      <div className="col" style={{ gap: 2, marginTop: 4, fontSize: 11, lineHeight: 1.2 }}>
        {items.map((it,i) => <div key={i}>· {it}</div>)}
      </div>
      {mins && <div className="wf-mono" style={{ marginTop: 4, color: c.dot, textAlign: 'right' }}>
        {status === 'cooking' ? `${mins} min restantes` : status === 'late' ? `+${mins} min` : `est. ${mins} min`}
      </div>}
      {status === 'queue' && (
        <div className="wf-btn primary" style={{ fontSize: 11, padding: '4px 8px', marginTop: 4 }}>iniciar →</div>
      )}
      {status === 'cooking' && (
        <div className="wf-btn ready" style={{ fontSize: 11, padding: '4px 8px', marginTop: 4 }}>marcar pronto ✓</div>
      )}
    </div>
  );
};

const KDS_A = () => (
  <Tablet statusBar={false}>
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>cozinha · pizzaria gigi</span>
      <div className="row" style={{ gap: 16, fontSize: 12, fontFamily: 'var(--mono)' }}>
        <span>fila: 4</span>
        <span>preparando: 3</span>
        <span style={{ color: 'var(--ready)' }}>prontos: 2</span>
        <span>20:42</span>
      </div>
    </div>
    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, height: 'calc(100% - 38px)', overflow: 'hidden' }}>
      <div>
        <div className="wf-mono" style={{ marginBottom: 6 }}>NA FILA · 4</div>
        <div className="col" style={{ gap: 6 }}>
          <KDSTicket table="07" num="2849" items={['1× pizza calabresa G', '+ borda catupiry']} time="20:18" status="queue" mins={22} />
          <KDSTicket table="03" num="2850" items={['2× hamb. cheddar', 'sem cebola']} time="20:20" status="queue" mins={12} />
          <KDSTicket table="11" num="2851" items={['1× pizza margherita G']} time="20:21" status="queue" mins={20} />
        </div>
      </div>
      <div>
        <div className="wf-mono" style={{ marginBottom: 6, color: 'var(--accent)' }}>PREPARANDO · 3</div>
        <div className="col" style={{ gap: 6 }}>
          <KDSTicket table="07" num="2848" items={['1× pizza portuguesa M']} time="20:08" status="cooking" mins={4} />
          <KDSTicket table="05" num="2845" items={['3× hamb. duplo', 'fritas']} time="20:12" status="cooking" mins={2} />
          <KDSTicket table="09" num="2843" items={['1× pizza 4 queijos G', 'borda cheddar']} time="20:00" status="late" mins={3} />
        </div>
      </div>
      <div>
        <div className="wf-mono" style={{ marginBottom: 6, color: 'var(--ready)' }}>PRONTO · LEVAR · 2</div>
        <div className="col" style={{ gap: 6 }}>
          <KDSTicket table="02" num="2842" items={['1× pizza pepperoni G']} time="20:39" status="ready" />
          <KDSTicket table="08" num="2840" items={['2× hamb. veggie', 'extra queijo']} time="20:40" status="ready" />
        </div>
      </div>
    </div>
  </Tablet>
);

const KDS_B = () => (
  <Tablet statusBar={false}>
    {/* Single big-priority view — current "now cooking" + next-up sidebar */}
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>cozinha · modo foco</span>
      <span className="wf-mono">7 itens · 20:42</span>
    </div>
    <div style={{ display: 'flex', height: 'calc(100% - 32px)' }}>
      <div style={{ flex: 1.6, padding: 16, borderRight: '2px solid var(--line)' }}>
        <div className="wf-mono" style={{ color: 'var(--accent)' }}>FAZENDO AGORA</div>
        <div className="row between" style={{ marginTop: 4 }}>
          <span className="wf-h1" style={{ fontSize: 36 }}>pizza portuguesa M</span>
          <ProgRing size={70} pct={0.8} label="2:10" />
        </div>
        <div className="wf-tiny">mesa 05 · #2848 · iniciado 20:08</div>
        <div style={{ marginTop: 12 }}>
          <div className="wf-mono">CHECKLIST</div>
          <div className="col" style={{ gap: 6, marginTop: 6, fontSize: 14 }}>
            {[
              ['✓', 'massa aberta'],
              ['✓', 'molho + mussarela'],
              ['●', 'presunto, ovo, cebola'],
              ['○', 'forno (3 min)'],
              ['○', 'finalizar com azeitona'],
            ].map(([m,t],i) => (
              <div key={i} className="row" style={{ gap: 10, color: m === '○' ? 'var(--ink-3)' : 'var(--ink)' }}>
                <span style={{ width: 14, color: m === '✓' ? 'var(--ready)' : m === '●' ? 'var(--accent)' : 'var(--ink-3)' }}>{m}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 14 }}>
          <div className="wf-btn">pausar</div>
          <div className="wf-btn ready" style={{ flex: 1 }}>marcar pronto ✓</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, background: 'var(--paper-2)', overflow: 'hidden' }}>
        <div className="wf-mono">PRÓXIMOS NA FILA</div>
        <div className="col" style={{ gap: 6, marginTop: 6 }}>
          <KDSTicket table="07" num="2849" items={['pizza calabresa G']} time="20:18" status="queue" mins={22} />
          <KDSTicket table="03" num="2850" items={['2× hamb. cheddar']} time="20:20" status="queue" mins={12} />
          <KDSTicket table="11" num="2851" items={['pizza margherita G']} time="20:21" status="queue" mins={20} />
        </div>
      </div>
    </div>
  </Tablet>
);

const KDS_C = () => (
  <Tablet statusBar={false}>
    {/* Risky: timeline / Gantt style by station */}
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 14px',
      display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--display)', fontSize: 18 }}>cozinha · linha do tempo</span>
      <span className="wf-mono">→ próximos 30 min · 20:42</span>
    </div>
    <div style={{ padding: 12, height: 'calc(100% - 32px)' }}>
      {/* time axis */}
      <div className="row" style={{ paddingLeft: 80, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-3)' }}>
        {[0,5,10,15,20,25,30].map(t => (
          <div key={t} style={{ flex: 1, borderLeft: '1px dashed var(--line)', paddingLeft: 4 }}>+{t}m</div>
        ))}
      </div>
      <div className="col" style={{ gap: 6, marginTop: 6 }}>
        {[
          { st: 'forno 1', items: [
            { t: 'pizza portuguesa M · #2848', start: 0, w: 12, c: 'var(--accent)' },
            { t: 'pizza calabresa G · #2849', start: 13, w: 22, c: 'var(--ink-3)', dashed: true },
          ]},
          { st: 'forno 2', items: [
            { t: 'pizza 4q G · #2843 ⚠', start: 0, w: 6, c: 'var(--alert)' },
            { t: 'pizza margherita · #2851', start: 8, w: 20, c: 'var(--ink-3)', dashed: true },
          ]},
          { st: 'chapa', items: [
            { t: '3× hamb · #2845', start: 0, w: 4, c: 'var(--accent)' },
            { t: '2× hamb · #2850', start: 5, w: 12, c: 'var(--ink-3)', dashed: true },
          ]},
          { st: 'frio/saladas', items: [] },
        ].map((row,i) => (
          <div key={i} className="row" style={{ height: 38, gap: 0, position: 'relative', borderBottom: '1px dashed var(--line)' }}>
            <div style={{ width: 80, fontSize: 11, fontFamily: 'var(--display)', paddingRight: 6 }}>{row.st}</div>
            <div className="grow" style={{ position: 'relative', height: '100%' }}>
              {row.items.map((it,j) => (
                <div key={j} className="wf-box" style={{
                  position: 'absolute', top: 6, left: `${(it.start/30)*100}%`,
                  width: `${(it.w/30)*100 - 0.5}%`, height: 26,
                  background: it.dashed ? 'var(--paper)' : it.c,
                  borderColor: it.c, borderStyle: it.dashed ? 'dashed' : 'solid',
                  color: it.dashed ? 'var(--ink)' : 'var(--paper)',
                  fontSize: 10, padding: '2px 6px',
                  display: 'flex', alignItems: 'center', overflow: 'hidden',
                }}>{it.t}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 14, paddingLeft: 80 }}>
        <span className="wf-pill" style={{ fontSize: 11, padding: '2px 8px', background: 'var(--accent)', color: 'var(--paper)', border: 'none' }}>cozinhando</span>
        <span className="wf-pill" style={{ fontSize: 11, padding: '2px 8px' }}>na fila</span>
        <span className="wf-pill" style={{ fontSize: 11, padding: '2px 8px', background: 'var(--alert)', color: 'var(--paper)', border: 'none' }}>atrasado</span>
        <Annotate style={{ position: 'static', marginLeft: 'auto' }}>arraste pedidos pra reordenar</Annotate>
      </div>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// Garçom App
// ─────────────────────────────────────────────

const Garcom_A = () => (
  <Tablet statusBar={false}>
    {/* Phone-shaped panel inside the tablet to make it feel mobile-y */}
    <div style={{ height: '100%', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
      <div style={{
        width: 320, height: '100%', background: 'var(--paper)',
        borderRadius: 18, border: '2px solid var(--line)', overflow: 'hidden',
        boxShadow: '4px 4px 0 var(--line)',
      }}>
        <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '10px 14px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>garçom · Tiago</div>
          <div className="wf-mono" style={{ fontSize: 10, opacity: 0.7 }}>turno · 6 mesas atendendo</div>
        </div>
        <div style={{ padding: 12 }}>
          <div className="wf-mono" style={{ marginBottom: 6, color: 'var(--accent)' }}>🛎 CHAMADOS · 2</div>
          <div className="col" style={{ gap: 6 }}>
            <div className="wf-box" style={{ padding: 8, borderColor: 'var(--accent)', borderWidth: 2, background: 'var(--accent-soft)' }}>
              <div className="row between">
                <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>mesa 11</span>
                <span className="wf-mono">há 22s</span>
              </div>
              <div style={{ fontSize: 12 }}>🧾 fechar conta</div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                <div className="wf-btn ready" style={{ fontSize: 11, padding: '3px 8px' }}>aceitar</div>
                <div className="wf-btn ghost" style={{ fontSize: 11, padding: '3px 8px' }}>passar</div>
              </div>
            </div>
            <div className="wf-box" style={{ padding: 8 }}>
              <div className="row between">
                <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>mesa 04</span>
                <span className="wf-mono">há 1m</span>
              </div>
              <div style={{ fontSize: 12 }}>🍴 mais talheres</div>
            </div>
          </div>
          <div className="wf-mono" style={{ marginTop: 12, marginBottom: 6 }}>📋 PEDIDOS PRA LEVAR · 3</div>
          <div className="col" style={{ gap: 4, fontSize: 12 }}>
            <div className="wf-box row between" style={{ padding: 6 }}>
              <span>mesa 02 · 2× guaraná, água</span>
              <span className="wf-tiny">→</span>
            </div>
            <div className="wf-box row between" style={{ padding: 6 }}>
              <span>mesa 07 · brownie, sorvete</span>
              <span className="wf-tiny">→</span>
            </div>
            <div className="wf-box row between" style={{ padding: 6, background: 'var(--ready-soft)' }}>
              <span>mesa 08 · 🛎 hamb pronto na cozinha</span>
              <span className="wf-tiny">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Tablet>
);

const Garcom_B = () => (
  <Tablet statusBar={false}>
    {/* Floor map view with table states */}
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 14px',
      display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>salão · ao vivo</span>
      <div className="row" style={{ gap: 12, fontSize: 11, fontFamily: 'var(--mono)' }}>
        <span><span className="dot ready" /> ok · 8</span>
        <span><span className="dot preparing" /> chamando · 2</span>
        <span><span className="dot waiting" /> livre · 3</span>
      </div>
    </div>
    <div style={{ padding: 16, height: 'calc(100% - 32px)', position: 'relative', background: 'var(--paper-2)' }}>
      {[
        { n: '01', x: 8, y: 8, st: 'ready', sz: 'M' },
        { n: '02', x: 26, y: 8, st: 'ready', sz: 'M' },
        { n: '03', x: 44, y: 8, st: 'preparing', alert: '🛎', sz: 'L' },
        { n: '04', x: 8, y: 38, st: 'ready', sz: 'M' },
        { n: '05', x: 26, y: 38, st: 'ready', sz: 'M' },
        { n: '06', x: 44, y: 38, st: 'waiting', sz: 'M' },
        { n: '07', x: 64, y: 8, st: 'ready', sz: 'XL', tag: 'mesa atual' },
        { n: '08', x: 64, y: 38, st: 'ready', sz: 'M' },
        { n: '09', x: 8, y: 68, st: 'waiting', sz: 'M' },
        { n: '10', x: 26, y: 68, st: 'ready', sz: 'M' },
        { n: '11', x: 44, y: 68, st: 'preparing', alert: '🧾', sz: 'L' },
        { n: '12', x: 64, y: 68, st: 'waiting', sz: 'M' },
      ].map((t,i) => (
        <div key={i} className="wf-box" style={{
          position: 'absolute', left: `${t.x}%`, top: `${t.y}%`,
          width: t.sz === 'XL' ? 90 : t.sz === 'L' ? 75 : 65,
          height: 60, padding: 6,
          background: t.st === 'preparing' ? 'var(--accent-soft)' : t.st === 'waiting' ? 'var(--paper)' : 'var(--ready-soft)',
          borderColor: t.st === 'preparing' ? 'var(--accent)' : t.st === 'waiting' ? 'var(--ink-3)' : 'var(--ready)',
          borderStyle: t.st === 'waiting' ? 'dashed' : 'solid',
          borderWidth: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18 }}>m{t.n}</div>
          {t.alert && <div style={{ fontSize: 16 }}>{t.alert}</div>}
          {t.tag && <div className="wf-tiny">{t.tag}</div>}
          {!t.alert && !t.tag && <div className="wf-tiny">{t.st === 'waiting' ? 'livre' : 'ok'}</div>}
        </div>
      ))}
    </div>
  </Tablet>
);

const Garcom_C = () => (
  <Tablet statusBar={false}>
    {/* Risky: priority queue / "next thing to do" coach */}
    <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '6px 14px' }}>
      <div className="row between">
        <span style={{ fontFamily: 'var(--display)', fontSize: 16 }}>tiago · próxima parada</span>
        <span className="wf-mono">7 coisas pendentes</span>
      </div>
    </div>
    <div style={{ padding: 18, height: 'calc(100% - 32px)' }}>
      <div className="wf-box" style={{
        padding: 16, background: 'var(--accent-soft)', borderColor: 'var(--accent)', borderWidth: 2.5,
        boxShadow: '4px 4px 0 var(--line)',
      }}>
        <div className="wf-mono" style={{ color: 'var(--accent)' }}>FAZ ISSO AGORA →</div>
        <div className="wf-h1" style={{ fontSize: 30, marginTop: 4 }}>levar pizza calabresa pra mesa 07</div>
        <div className="row" style={{ gap: 14, marginTop: 8, fontSize: 13 }}>
          <span>📍 saiu do forno há 12s</span>
          <span>🚶 ~ 20s até a mesa</span>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <div className="wf-btn ready" style={{ fontSize: 14 }}>peguei ✓</div>
          <div className="wf-btn ghost" style={{ fontSize: 14 }}>delegar</div>
          <Annotate style={{ position: 'static', marginLeft: 'auto', alignSelf: 'center' }}>
            uma coisa por vez · sem ansiedade
          </Annotate>
        </div>
      </div>
      <div className="wf-mono" style={{ marginTop: 16 }}>DEPOIS</div>
      <div className="col" style={{ gap: 4, marginTop: 6, fontSize: 12 }}>
        {[
          { p: 1, n: 'mesa 11 · fechar conta', t: 'há 22s' },
          { p: 2, n: 'mesa 04 · mais talheres', t: 'há 1m' },
          { p: 3, n: 'mesa 02 · levar bebidas', t: 'há 2m' },
          { p: 4, n: 'mesa 08 · hamb pronto', t: 'em 3m' },
        ].map((t,i) => (
          <div key={i} className="row wf-box" style={{ padding: 6, gap: 10 }}>
            <span className="wf-mono" style={{ width: 16, color: 'var(--ink-3)' }}>{t.p}</span>
            <span className="grow">{t.n}</span>
            <span className="wf-tiny">{t.t}</span>
            <span className="wf-tiny">≡</span>
          </div>
        ))}
      </div>
    </div>
  </Tablet>
);

Object.assign(window, {
  KDS_A, KDS_B, KDS_C,
  Garcom_A, Garcom_B, Garcom_C,
});
