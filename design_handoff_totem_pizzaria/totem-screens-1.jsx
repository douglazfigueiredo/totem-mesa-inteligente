// Totem screens — 10 screens × 3 variations
// Tablet landscape: 720 × 500

// ─────────────────────────────────────────────
// 01 · Tela inicial / boas-vindas
// ─────────────────────────────────────────────
const Welcome_A = () => (
  <Tablet>
    <div style={{ paddingTop: 30, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 30 }}>
      <div className="wf-h1" style={{ fontSize: 56, lineHeight: 1 }}>oi, mesa 07!</div>
      <Scribble w={180} />
      <div style={{ fontSize: 18, textAlign: 'center', maxWidth: 420 }}>
        toque na tela pra começar seu pedido. <br/>
        sem fila, sem garçom — direto da sua mesa.
      </div>
      <div className="wf-btn primary" style={{ fontSize: 22, padding: '14px 40px' }}>começar →</div>
      <div className="wf-tiny" style={{ marginTop: 10 }}>já com pedido aberto? <u>continuar</u></div>
    </div>
    <CallWaiter style={{ bottom: 16, right: 16 }} />
  </Tablet>
);

const Welcome_B = () => (
  <Tablet>
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1.5px dashed var(--line)' }}>
        <div>
          <div className="wf-mono" style={{ marginBottom: 8 }}>MESA 07</div>
          <div className="wf-h1" style={{ fontSize: 44 }}>boa noite!</div>
          <div style={{ fontSize: 16, marginTop: 12 }}>aqui você pede, acompanha o preparo e chama o garçom.</div>
        </div>
        <div className="col">
          <div className="wf-btn accent" style={{ fontSize: 18, justifyContent: 'flex-start' }}>🍕  ver cardápio</div>
          <div className="wf-btn" style={{ fontSize: 16, justifyContent: 'flex-start' }}>🛎  chamar garçom</div>
          <div className="wf-btn ghost" style={{ fontSize: 14, justifyContent: 'flex-start' }}>📋  ver conta</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="wf-mono">DESTAQUES DA NOITE</div>
        <div className="wf-photo wobble" style={{ flex: 1 }}>foto · pizza da casa</div>
        <div className="wf-photo wobble" style={{ height: 60 }}>foto · combo brotinho</div>
      </div>
    </div>
  </Tablet>
);

const Welcome_C = () => (
  <Tablet>
    {/* Bold/risky: full-bleed conversational entry */}
    <div style={{ height: '100%', padding: 0, position: 'relative', background: 'var(--paper-2)' }}>
      <div className="hatch" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 50px' }}>
        <div className="wf-mono" style={{ marginBottom: 8 }}>MESA 07</div>
        <div className="wf-h1" style={{ fontSize: 64, lineHeight: 0.9 }}>
          fome de<br/>quê hoje?
        </div>
        <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['🍕 pizza','🍔 lanche','🥤 bebida','🍰 doce','🤔 surpreenda'].map(t => (
            <div key={t} className="wf-pill" style={{ fontSize: 16, padding: '8px 14px' }}>{t}</div>
          ))}
        </div>
        <div className="wf-tiny" style={{ marginTop: 22 }}>toque uma vibe pra começar →</div>
      </div>
      <CallWaiter style={{ bottom: 16, right: 16 }} />
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 02 · Cardápio (browse)
// ─────────────────────────────────────────────
const Menu_A = () => (
  <Tablet>
    <div style={{ paddingTop: 22 }}>
      <TabBar tabs={['pizzas salgadas','pizzas doces','lanches','bebidas','sobremesas']} active={0} />
      <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {['margherita','calabresa','portuguesa','frango catup.','quatro queijos','pepperoni','marguerita rúcula','vegetariana'].map((n,i) => (
          <MenuCard key={i} name={n} price={`R$ ${48+i*4}`} w="100%" h={100} />
        ))}
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px',
      borderTop: '1.5px solid var(--line)', background: 'var(--paper)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="wf-mono">3 itens · R$ 142,00</div>
      <div className="wf-btn primary">ver carrinho →</div>
    </div>
    <CallWaiter style={{ top: 28, right: 12 }} label="🛎" />
  </Tablet>
);

const Menu_B = () => (
  <Tablet>
    <div style={{ display: 'flex', height: '100%', paddingTop: 22 }}>
      <div style={{ width: 130, borderRight: '1.5px solid var(--line)', padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="wf-mono">CATEGORIAS</div>
        {['pizzas','lanches','bebidas','sobremesas','combos'].map((c,i) => (
          <div key={c} className="wf-box" style={{
            padding: '8px 10px', fontSize: 14,
            background: i === 0 ? 'var(--line)' : 'var(--paper)',
            color: i === 0 ? 'var(--paper)' : 'var(--ink)',
            borderRadius: 6,
          }}>{c}</div>
        ))}
      </div>
      <div style={{ flex: 1, padding: 14, overflow: 'hidden' }}>
        <div className="wf-h2" style={{ marginBottom: 10 }}>pizzas <span style={{color:'var(--accent)'}}>·</span> 18 opções</div>
        <div className="col" style={{ gap: 8 }}>
          {['margherita — molho, mussarela, manjericão','calabresa — calabresa fininha, cebola','portuguesa — presunto, ovo, ervilha','quatro queijos — mussarela, gorgon., parm., catup.'].map((d,i) => (
            <div key={i} className="row wf-box" style={{ padding: 8, gap: 10 }}>
              <div className="wf-photo" style={{ width: 60, height: 50 }}>foto</div>
              <div className="grow" style={{ fontSize: 13 }}>{d}</div>
              <div className="wf-mono" style={{ color: 'var(--accent)' }}>R$ {52+i*5}</div>
              <div className="wf-btn" style={{ fontSize: 14, padding: '4px 10px' }}>+</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <CallWaiter style={{ bottom: 12, right: 12 }} />
  </Tablet>
);

const Menu_C = () => (
  <Tablet>
    {/* Risky: stories-style horizontal swipe per category */}
    <div style={{ paddingTop: 28, height: '100%' }}>
      <div style={{ padding: '4px 16px', display: 'flex', justifyContent:'space-between', alignItems: 'baseline' }}>
        <div className="wf-h2">cardápio</div>
        <div className="wf-mono">deslize ←→ pra mais</div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '6px 16px', overflow: 'hidden' }}>
        {['🍕','🍔','🥤','🍰','🥗'].map((e,i) => (
          <div key={i} className="wf-pill" style={{
            width: 56, height: 56, justifyContent: 'center', flexDirection: 'column',
            background: i === 0 ? 'var(--accent-soft)' : 'var(--paper)',
            border: i === 0 ? '2px solid var(--accent)' : '1.5px solid var(--line)',
            borderRadius: 12, fontSize: 22, padding: 0,
          }}>{e}</div>
        ))}
      </div>
      <div style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'stretch', overflow: 'hidden' }}>
        {[0,1,2].map(i => (
          <div key={i} className="wf-box wobble" style={{
            width: i === 0 ? 320 : 200, padding: 10, display: 'flex', flexDirection: 'column', gap: 6,
            opacity: i === 2 ? 0.5 : 1,
          }}>
            <div className="wf-photo" style={{ height: i === 0 ? 200 : 130 }}>foto grande</div>
            <div className="wf-h3">pizza calabresa {i === 0 && '⭐'}</div>
            <div className="wf-tiny">calabresa fatiada, cebola roxa, azeitona preta, manjericão fresquinho</div>
            <div className="row between">
              <span className="wf-mono">R$ 64</span>
              <span className="wf-btn accent" style={{ fontSize: 14, padding: '4px 12px' }}>+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Annotate style={{ top: 90, left: 280, color: 'var(--accent)' }}>
      cards "stories" — 1 destaque + bisbilhotada nos próximos
    </Annotate>
  </Tablet>
);

// ─────────────────────────────────────────────
// 03 · Detalhe + customização
// ─────────────────────────────────────────────
const Detail_A = () => (
  <Tablet>
    <div style={{ paddingTop: 22, display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, padding: 16 }}>
        <div className="wf-photo" style={{ height: 240, marginBottom: 12 }}>foto · pizza calabresa 30cm</div>
        <div className="wf-h2">pizza calabresa</div>
        <div className="wf-tiny" style={{ marginTop: 4 }}>calabresa fatiada, cebola roxa, azeitona preta, orégano</div>
      </div>
      <div style={{ flex: 1, padding: 16, borderLeft: '1.5px dashed var(--line)' }}>
        <div className="wf-mono" style={{ marginBottom: 6 }}>TAMANHO</div>
        <div className="row" style={{ marginBottom: 14 }}>
          {['broto','média','grande'].map((s,i) => (
            <div key={s} className={`wf-pill${i===2?' active':''}`} style={{ fontSize: 13 }}>{s}</div>
          ))}
        </div>
        <div className="wf-mono" style={{ marginBottom: 6 }}>BORDA</div>
        <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
          {['tradicional','catupiry +6','cheddar +6'].map((s,i) => (
            <div key={s} className={`wf-pill${i===0?' active':''}`} style={{ fontSize: 13 }}>{s}</div>
          ))}
        </div>
        <div className="wf-mono" style={{ marginBottom: 6 }}>ADICIONAIS</div>
        <div className="col" style={{ gap: 4, fontSize: 13 }}>
          {['+ bacon (+R$5)','+ catupiry extra (+R$4)','+ azeitona (+R$2)'].map(s => (
            <div key={s} className="row between wf-box" style={{ padding: '6px 10px' }}>
              <span>{s}</span><span>○</span>
            </div>
          ))}
        </div>
        <div className="row between" style={{ marginTop: 14 }}>
          <div className="row">
            <div className="wf-btn" style={{ width: 32, padding: 0 }}>−</div>
            <span className="wf-h3">1</span>
            <div className="wf-btn" style={{ width: 32, padding: 0 }}>+</div>
          </div>
          <div className="wf-btn primary">add R$ 64</div>
        </div>
      </div>
    </div>
  </Tablet>
);

const Detail_B = () => (
  <Tablet>
    <div style={{ paddingTop: 22, height: '100%', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="row between">
        <span className="wf-mono">← voltar</span>
        <div className="wf-h2">monte sua pizza</div>
        <span className="wf-mono">3/4 sabores</span>
      </div>
      <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg width="220" height="220" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="var(--paper-2)" stroke="var(--line)" strokeWidth="1.5" />
            <line x1="50" y1="4" x2="50" y2="96" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 2"/>
            <line x1="4" y1="50" x2="96" y2="50" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 2"/>
            <text x="28" y="32" fontSize="6" fontFamily="var(--hand)">calabresa</text>
            <text x="58" y="32" fontSize="6" fontFamily="var(--hand)">marg.</text>
            <text x="22" y="72" fontSize="6" fontFamily="var(--hand)">portuguesa</text>
            <text x="62" y="72" fontSize="6" fontFamily="var(--hand)" fill="var(--ink-3)">+ sabor</text>
            <circle cx="75" cy="68" r="5" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" strokeDasharray="1 1"/>
            <text x="71" y="71" fontSize="6" fontFamily="var(--hand)" fill="var(--accent)">+</text>
          </svg>
        </div>
        <div className="grow col" style={{ gap: 8 }}>
          <div className="wf-mono">SABORES ESCOLHIDOS</div>
          {['calabresa','margherita','portuguesa'].map(s => (
            <div key={s} className="row between wf-box" style={{ padding: '6px 10px', fontSize: 13 }}>
              <span>· {s}</span><span className="wf-tiny">×</span>
            </div>
          ))}
          <div className="wf-tiny" style={{ marginTop: 4 }}>preço pelo sabor mais caro · R$ 78</div>
        </div>
      </div>
      <div className="row between" style={{ marginTop: 'auto' }}>
        <div className="wf-tiny">borda: catupiry · tamanho: grande</div>
        <div className="wf-btn primary">add ao pedido</div>
      </div>
    </div>
  </Tablet>
);

const Detail_C = () => (
  <Tablet>
    {/* Risky: drag toppings onto pizza */}
    <div style={{ paddingTop: 22, height: '100%', padding: 16 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <span className="wf-mono">← cardápio</span>
        <span className="wf-h3">arraste o que quiser →</span>
      </div>
      <div className="row" style={{ gap: 16, alignItems: 'stretch', height: 360 }}>
        <div className="wf-box fill" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="240" height="240" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="#f8e6c8" stroke="var(--line)" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="36" fill="#e35b3a" opacity="0.4"/>
            <circle cx="42" cy="42" r="3" fill="var(--alert)"/>
            <circle cx="56" cy="46" r="3" fill="var(--alert)"/>
            <circle cx="48" cy="58" r="3" fill="var(--alert)"/>
            <circle cx="60" cy="60" r="2.5" fill="var(--ready)"/>
            <circle cx="40" cy="56" r="2.5" fill="var(--ready)"/>
          </svg>
          <Annotate style={{ bottom: 10, left: 14 }}>solte aqui ↓</Annotate>
        </div>
        <div className="col" style={{ width: 200, gap: 6 }}>
          <div className="wf-mono">INGREDIENTES</div>
          {['calabresa','mussarela','tomate','azeitona','cebola','manjericão','catupiry','pimenta'].map((t,i) => (
            <div key={t} className="row between wf-box" style={{ padding: '4px 8px', fontSize: 12, cursor: 'grab' }}>
              <span>≡ {t}</span>
              <span className="wf-mono" style={{ color: 'var(--accent)' }}>+R${i+1}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="row between" style={{ marginTop: 10 }}>
        <span className="wf-tiny">já adicionou: calabresa, mussarela, azeitona</span>
        <div className="wf-btn primary">add R$ 71</div>
      </div>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 04 · Carrinho
// ─────────────────────────────────────────────
const Cart_A = () => (
  <Tablet>
    <div style={{ paddingTop: 22, padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="wf-h2">seu pedido · mesa 07</div>
      <div className="col" style={{ gap: 6, flex: 1 }}>
        {[
          { n: 'pizza calabresa grande', mod: 'borda catupiry, +bacon', q: 1, p: 78 },
          { n: 'hamb. cheddar bacon', mod: 'sem cebola', q: 2, p: 42 },
          { n: 'guaraná 600ml', mod: '', q: 2, p: 9 },
        ].map((it,i) => (
          <div key={i} className="wf-box row" style={{ padding: 10, gap: 10 }}>
            <div className="wf-photo" style={{ width: 50, height: 40, fontSize: 9 }}>foto</div>
            <div className="grow">
              <div style={{ fontSize: 14 }}>{it.n}</div>
              {it.mod && <div className="wf-tiny">{it.mod}</div>}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="wf-pill" style={{ padding: '2px 8px', fontSize: 12 }}>−</span>
              <span style={{ fontFamily:'var(--display)' }}>{it.q}</span>
              <span className="wf-pill" style={{ padding: '2px 8px', fontSize: 12 }}>+</span>
            </div>
            <div className="wf-mono" style={{ width: 56, textAlign: 'right' }}>R$ {it.p*it.q}</div>
          </div>
        ))}
      </div>
      <div className="wf-box fill" style={{ padding: 10 }}>
        <div className="row between"><span>subtotal</span><span className="wf-mono">R$ 180</span></div>
        <div className="row between"><span>serviço 10%</span><span className="wf-mono">R$ 18</span></div>
        <div className="row between" style={{ marginTop: 4, fontSize: 18, fontFamily: 'var(--display)' }}>
          <span>total</span><span>R$ 198,00</span>
        </div>
      </div>
      <div className="row between">
        <div className="wf-btn ghost">+ add mais itens</div>
        <div className="wf-btn primary" style={{ fontSize: 16 }}>enviar pedido →</div>
      </div>
    </div>
  </Tablet>
);

const Cart_B = () => (
  <Tablet>
    {/* Split: cozinha vs garçom */}
    <div style={{ paddingTop: 22, padding: 16, height: '100%' }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="wf-h2">revisar pedido</span>
        <span className="wf-tiny">vai pra cozinha + garçom · separados auto</span>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
        <div className="wf-box" style={{ flex: 1, padding: 10, borderColor: 'var(--accent)' }}>
          <div className="wf-mono row between" style={{ color: 'var(--accent)' }}>
            <span>🍕 PRA COZINHA</span><span>~22 min</span>
          </div>
          <div className="col" style={{ gap: 6, marginTop: 8, fontSize: 13 }}>
            <div className="row between"><span>1× pizza calabresa G</span><span className="wf-mono">R$ 78</span></div>
            <div className="row between"><span>2× hamb. cheddar</span><span className="wf-mono">R$ 84</span></div>
          </div>
        </div>
        <div className="wf-box" style={{ flex: 1, padding: 10, borderColor: 'var(--ink-2)' }}>
          <div className="wf-mono row between"><span>🛎 PRO GARÇOM</span><span>~5 min</span></div>
          <div className="col" style={{ gap: 6, marginTop: 8, fontSize: 13 }}>
            <div className="row between"><span>2× guaraná 600ml</span><span className="wf-mono">R$ 18</span></div>
            <div className="row between"><span>1× brownie</span><span className="wf-mono">R$ 16</span></div>
          </div>
        </div>
      </div>
      <div className="wf-box fill" style={{ padding: 10, marginTop: 12 }}>
        <div className="row between" style={{ fontSize: 18, fontFamily: 'var(--display)' }}>
          <span>total</span><span>R$ 196,00</span>
        </div>
        <div className="wf-tiny">cozinha começa a preparar quando aceitar</div>
      </div>
      <div className="row between" style={{ marginTop: 10 }}>
        <div className="wf-btn ghost">← editar</div>
        <div className="wf-btn primary">confirmar e enviar</div>
      </div>
    </div>
  </Tablet>
);

const Cart_C = () => (
  <Tablet>
    {/* Risky: timeline/visual receipt */}
    <div style={{ paddingTop: 22, padding: 16, height: '100%' }}>
      <div className="wf-h2" style={{ marginBottom: 8 }}>como vai chegar</div>
      <div className="wf-tiny" style={{ marginBottom: 14 }}>itens chegam em ondas conforme ficam prontos</div>
      <div className="col" style={{ gap: 0, position: 'relative' }}>
        {[
          { t: '~ 5 min', items: ['guaraná', 'água com gás'], color: 'var(--ink-3)', icon: '🥤' },
          { t: '~ 12 min', items: ['hamb. cheddar bacon ×2', 'fritas'], color: 'var(--accent)', icon: '🍔' },
          { t: '~ 22 min', items: ['pizza calabresa G'], color: 'var(--accent)', icon: '🍕' },
          { t: 'no fim', items: ['brownie c/ sorvete'], color: 'var(--ink-2)', icon: '🍰' },
        ].map((w,i) => (
          <div key={i} className="row" style={{ gap: 12, padding: '8px 0', borderBottom: i<3 ? '1px dashed var(--line)' : 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `2px solid ${w.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, background: 'var(--paper)',
            }}>{w.icon}</div>
            <div className="grow">
              <div className="wf-mono" style={{ color: w.color }}>{w.t}</div>
              <div style={{ fontSize: 13 }}>{w.items.join(' · ')}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="row between" style={{ marginTop: 14 }}>
        <span className="wf-mono">total · R$ 214</span>
        <div className="wf-btn primary">enviar pedido</div>
      </div>
    </div>
  </Tablet>
);

// ─────────────────────────────────────────────
// 05 · Confirmação
// ─────────────────────────────────────────────
const Confirm_A = () => (
  <Tablet>
    <div style={{ paddingTop: 22, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 }}>
      <div style={{ fontSize: 60 }}>✓</div>
      <div className="wf-h1">pedido enviado!</div>
      <Scribble w={140} />
      <div style={{ fontSize: 16, textAlign: 'center', maxWidth: 380 }}>
        a cozinha já recebeu. assim que começar o preparo, você vê o tempo aqui.
      </div>
      <div className="wf-mono">pedido #2847 · mesa 07</div>
      <div className="row" style={{ marginTop: 14 }}>
        <div className="wf-btn">+ pedir mais coisa</div>
        <div className="wf-btn primary">acompanhar →</div>
      </div>
    </div>
  </Tablet>
);

const Confirm_B = () => (
  <Tablet>
    <div style={{ paddingTop: 22, height: '100%', padding: 20, display: 'flex', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="wf-mono">PEDIDO #2847</div>
        <div className="wf-h1" style={{ fontSize: 40, marginTop: 6 }}>foi! ✨</div>
        <div style={{ marginTop: 12, fontSize: 14 }}>cozinha recebeu, vai começar quando estiver na fila.</div>
        <div className="col" style={{ marginTop: 18, gap: 6 }}>
          <div className="row" style={{ gap: 8 }}><span className="dot waiting"/><span style={{fontSize:13}}>recebido — agora</span></div>
          <div className="row" style={{ gap: 8 }}><span className="dot waiting"/><span style={{fontSize:13, color:'var(--ink-3)'}}>em preparo — em breve</span></div>
          <div className="row" style={{ gap: 8 }}><span className="dot waiting"/><span style={{fontSize:13, color:'var(--ink-3)'}}>pronto — depois</span></div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 14, background: 'var(--paper-2)', borderRadius: 8, fontSize: 13 }}>
        <div className="wf-mono">RESUMO</div>
        <div className="col" style={{ marginTop: 8, gap: 4 }}>
          <div>1× pizza calabresa</div>
          <div>2× hamb. cheddar bacon</div>
          <div>2× guaraná 600ml</div>
        </div>
        <div style={{ borderTop: '1px dashed var(--line)', marginTop: 10, paddingTop: 8 }}>
          <div className="row between"><span>total</span><span className="wf-mono">R$ 196</span></div>
        </div>
        <div className="wf-btn ghost" style={{ marginTop: 10, width: '100%', fontSize: 13 }}>ver detalhes</div>
      </div>
    </div>
  </Tablet>
);

const Confirm_C = () => (
  <Tablet>
    {/* Risky: live ticket-like card with stamps */}
    <div style={{ paddingTop: 22, height: '100%', display:'flex', alignItems:'center', justifyContent:'center', padding: 20, background: 'var(--paper-2)' }}>
      <div className="wf-box" style={{
        width: 380, padding: 20, background: 'var(--paper)',
        boxShadow: '4px 4px 0 var(--line)',
        borderRadius: 4,
        position: 'relative',
      }}>
        <div className="row between" style={{ borderBottom: '2px dashed var(--line)', paddingBottom: 8 }}>
          <span className="wf-mono">PEDIDO #2847</span>
          <span className="wf-mono">MESA 07</span>
        </div>
        <div className="wf-h1" style={{ fontSize: 30, marginTop: 12, textAlign: 'center' }}>
          tá no forno!
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>
          (assim que a galera começar, o cronômetro acende)
        </div>
        <div className="col" style={{ marginTop: 12, gap: 4, fontSize: 13 }}>
          <div className="row between"><span>1× pizza calabresa G</span><span className="wf-mono">R$ 78</span></div>
          <div className="row between"><span>2× hamb. cheddar</span><span className="wf-mono">R$ 84</span></div>
          <div className="row between"><span>2× guaraná 600ml</span><span className="wf-mono">R$ 18</span></div>
        </div>
        <div style={{
          position: 'absolute', top: 14, right: 14,
          border: '2px solid var(--accent)', borderRadius: '50%', padding: '8px 6px',
          fontFamily: 'var(--display)', color: 'var(--accent)', fontSize: 11, transform: 'rotate(-12deg)',
          textAlign: 'center', lineHeight: 1,
        }}>RECE-<br/>BIDO</div>
        <div className="row between" style={{ marginTop: 14, borderTop: '2px dashed var(--line)', paddingTop: 10 }}>
          <div className="wf-btn ghost" style={{ fontSize: 13 }}>+ pedir mais</div>
          <div className="wf-btn primary" style={{ fontSize: 14 }}>acompanhar →</div>
        </div>
      </div>
    </div>
  </Tablet>
);

Object.assign(window, {
  Welcome_A, Welcome_B, Welcome_C,
  Menu_A, Menu_B, Menu_C,
  Detail_A, Detail_B, Detail_C,
  Cart_A, Cart_B, Cart_C,
  Confirm_A, Confirm_B, Confirm_C,
});
