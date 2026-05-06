// Shared wireframe primitives for all surfaces
// Tablet landscape canvas: 720x500 (DCArtboard size)

const Tablet = ({ children, statusBar = true }) => (
  <div className="tablet-frame">
    <div className="tablet-screen">
      {statusBar && <StatusBar />}
      {children}
    </div>
  </div>
);

const StatusBar = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 12px', fontFamily: 'var(--mono)', fontSize: 10,
    color: 'var(--ink-3)', borderBottom: '1px dashed rgba(0,0,0,0.1)',
    background: 'var(--paper)', zIndex: 5,
  }}>
    <span>MESA 07 · pizzaria gigi</span>
    <span style={{display:'flex', gap:10}}>
      <span>wifi ●</span>
      <span>20:42</span>
      <span>bat 87%</span>
    </span>
  </div>
);

// Hand-drawn underline
const Scribble = ({ w = 80, color = 'var(--accent)' }) => (
  <svg width={w} height="6" viewBox={`0 0 ${w} 6`} style={{ display: 'block' }}>
    <path d={`M 2 4 Q ${w*0.25} 1, ${w*0.5} 3 T ${w-2} 3`}
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Sketchy progress ring (SVG)
const ProgRing = ({ size = 120, pct = 0.65, color = 'var(--accent)', label, sub }) => {
  const r = size/2 - 6;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size, display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <svg width={size} height={size} style={{ position:'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--ink-3)"
          strokeWidth="3" strokeOpacity="0.25" strokeDasharray="2 4" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div className="wf-h1" style={{ fontSize: size*0.32 }}>{label}</div>
        {sub && <div className="wf-mono" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
};

// Sketchy bar progress
const Bar = ({ pct = 0.5, h = 10, color = 'var(--accent)' }) => (
  <div style={{
    height: h, background: 'var(--paper-2)',
    border: '1.5px solid var(--line)', borderRadius: 999, overflow: 'hidden',
  }}>
    <div style={{
      height: '100%', width: `${pct*100}%`, background: color,
      borderRight: '1.5px solid var(--line)',
    }} />
  </div>
);

// Pizza-being-baked illustration (very simple, hand-drawn)
const PizzaBake = ({ size = 80, pct = 0.6 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display:'block' }}>
    <defs>
      <clipPath id={`pclip-${pct}`}>
        <rect x="0" y={100 - 100*pct} width="100" height={100*pct} />
      </clipPath>
    </defs>
    {/* oven outline */}
    <rect x="10" y="40" width="80" height="50" rx="4" fill="none" stroke="var(--line)" strokeWidth="2" />
    <rect x="14" y="44" width="72" height="38" rx="2" fill="var(--accent-soft)" stroke="var(--line)" strokeWidth="1.5" />
    {/* pizza */}
    <circle cx="50" cy="63" r="14" fill="var(--paper)" stroke="var(--line)" strokeWidth="2" />
    <circle cx="50" cy="63" r="10" fill="var(--accent)" clipPath={`url(#pclip-${pct})`} opacity="0.4" />
    <circle cx="46" cy="60" r="1.5" fill="var(--alert)" />
    <circle cx="53" cy="61" r="1.5" fill="var(--alert)" />
    <circle cx="50" cy="65" r="1.5" fill="var(--alert)" />
    <circle cx="48" cy="67" r="1" fill="var(--ready)" />
    {/* heat lines */}
    <path d="M 30 50 q 2 -3 0 -6 M 50 50 q 2 -3 0 -6 M 70 50 q 2 -3 0 -6"
      fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    {/* base */}
    <rect x="6" y="88" width="88" height="6" rx="2" fill="var(--ink-2)" />
  </svg>
);

// Tab bar (categories)
const TabBar = ({ tabs, active = 0 }) => (
  <div style={{
    display: 'flex', gap: 4, padding: '6px 14px',
    borderBottom: '1.5px solid var(--line)', background: 'var(--paper)',
    overflow: 'hidden',
  }}>
    {tabs.map((t, i) => (
      <div key={i} className={`wf-pill${i === active ? ' active' : ''}`}
        style={{ fontSize: 12, padding: '4px 10px' }}>{t}</div>
    ))}
  </div>
);

// Menu card (small)
const MenuCard = ({ name, price, w = 140, h = 90 }) => (
  <div className="wf-box" style={{
    width: w, height: h, padding: 6, display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <div className="wf-photo" style={{ flex: 1 }}>foto</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
      <span style={{ fontFamily: 'var(--display)' }}>{name}</span>
      <span className="wf-mono" style={{ color: 'var(--accent)' }}>{price}</span>
    </div>
  </div>
);

// Call-waiter pill
const CallWaiter = ({ style = {}, label = 'chamar garçom 🛎' }) => (
  <div className="wf-btn" style={{ position: 'absolute', ...style, fontSize: 13 }}>{label}</div>
);

// Mini floating timer
const MiniTimer = ({ pct = 0.6, time = '08:24', label = 'pizza calabresa', style = {} }) => (
  <div className="mini-timer" style={style}>
    <div className="ring">
      <span style={{position:'absolute', fontSize:9}}>{Math.round(pct*100)}%</span>
    </div>
    <div className="col" style={{ gap: 0 }}>
      <span className="wf-mono" style={{ fontSize: 10 }}>{label}</span>
      <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>{time}</span>
    </div>
  </div>
);

// Annotation arrow
const Annotate = ({ children, style = {} }) => (
  <div className="wf-anno" style={style}>{children}</div>
);

Object.assign(window, {
  Tablet, StatusBar, Scribble, ProgRing, Bar, PizzaBake,
  TabBar, MenuCard, CallWaiter, MiniTimer, Annotate
});
