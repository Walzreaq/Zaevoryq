// ZAEVORYQ AI — Signal History & Win/Loss Tracker

const sb = window.ZaevoryqAuth?.supabase;

// ============================================
// CREATE SIGNALS TABLE IN SUPABASE
// ============================================
const SIGNALS_SCHEMA = `
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  asset         text,
  signal_type   text,
  risk_level    text,
  confidence    int,
  rr            text,
  entry         numeric,
  sl            numeric,
  tp1           numeric,
  tp2           numeric,
  tp3           numeric,
  be            numeric,
  status        text default 'Active',
  mode          text,
  entry_tf      text,
  trend_tf      text,
  reasons       text[],
  hit_tp1       bool default false,
  hit_tp2       bool default false,
  hit_tp3       bool default false,
  hit_be        bool default false,
  hit_sl        bool default false,
  closed_at     timestamptz,
  pips_result   numeric
`;

// ============================================
// SAVE NEW SIGNAL TO DATABASE
// ============================================
async function saveSignal(signalData) {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('signals').insert([{
      asset:       signalData.asset,
      signal_type: signalData.signal,
      risk_level:  signalData.riskLevel,
      confidence:  signalData.confidence,
      rr:          signalData.rr,
      entry:       signalData.entry,
      sl:          signalData.sl,
      tp1:         signalData.tp1,
      tp2:         signalData.tp2,
      tp3:         signalData.tp3,
      be:          null,
      status:      'Active',
      mode:        signalData.mode,
      entry_tf:    signalData.entryTF,
      trend_tf:    signalData.trendTF,
      reasons:     signalData.reasons,
    }]).select();
    if (error) throw error;
    console.log('ZAEVORYQ AI — Signal saved:', data[0].id);
    return data[0];
  } catch (err) {
    console.error('Save signal error:', err);
    return null;
  }
}

// ============================================
// UPDATE SIGNAL STATUS
// ============================================
async function updateSignalStatus(signalId, status, extraData = {}) {
  if (!sb) return null;
  try {
    const updates = { status, ...extraData };
    if (['Hit SL','Hit Full TP','Hit BE'].includes(status)) {
      updates.closed_at = new Date().toISOString();
    }
    if (status === 'Hit TP1') updates.hit_tp1 = true;
    if (status === 'Hit TP2') updates.hit_tp2 = true;
    if (status === 'Hit Full TP') { updates.hit_tp1 = true; updates.hit_tp2 = true; updates.hit_tp3 = true; }
    if (status === 'Hit BE')  updates.hit_be  = true;
    if (status === 'Hit SL')  updates.hit_sl  = true;

    const { error } = await sb.from('signals').update(updates).eq('id', signalId);
    if (error) throw error;
    console.log('ZAEVORYQ AI — Signal updated:', signalId, status);
    return true;
  } catch (err) {
    console.error('Update signal error:', err);
    return false;
  }
}

// ============================================
// GET SIGNALS BASED ON PLAN
// ============================================
async function getSignals(plan = 'free', isAdmin = false) {
  if (!sb) return getDemoSignals(plan, isAdmin);
  try {
    let query = sb.from('signals').select('*').order('created_at', { ascending: false });

    if (isAdmin) {
      // Admin sees everything
    } else if (plan === 'elite') {
      // Elite sees current + previous month
      const now    = new Date();
      const start  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      query = query.gte('created_at', start.toISOString());
    } else if (plan === 'pro') {
      // Pro sees last 5 signals only
      query = query.limit(5);
    } else {
      // Free sees nothing — just stats
      return { signals: [], stats: await getStats() };
    }

    const { data, error } = await query;
    if (error) throw error;
    return { signals: data || [], stats: calculateStats(data || []) };
  } catch (err) {
    console.error('Get signals error:', err);
    return { signals: getDemoSignals(plan, isAdmin), stats: getDemoStats() };
  }
}

// ============================================
// GET OVERALL STATS
// ============================================
async function getStats() {
  if (!sb) return getDemoStats();
  try {
    const { data, error } = await sb.from('signals').select('status, confidence, rr');
    if (error) throw error;
    return calculateStats(data || []);
  } catch (err) {
    return getDemoStats();
  }
}

function calculateStats(signals) {
  const total   = signals.length;
  const wins    = signals.filter(s => ['Hit TP1','Hit TP2','Hit Full TP'].includes(s.status)).length;
  const losses  = signals.filter(s => s.status === 'Hit SL').length;
  const be      = signals.filter(s => s.status === 'Hit BE').length;
  const active  = signals.filter(s => s.status === 'Active' || s.status === 'Waiting').length;
  const winRate = total > 0 ? Math.round((wins / (total - active)) * 100) : 0;
  const fullTPs = signals.filter(s => s.status === 'Hit Full TP').length;

  return { total, wins, losses, be, active, winRate, fullTPs };
}

// ============================================
// DEMO DATA
// ============================================
function getDemoSignals(plan, isAdmin) {
  const all = [
    { id:'1', created_at:'2026-05-12T09:30:00Z', asset:'XAUUSD', signal_type:'BUY', risk_level:'LOW RISK', confidence:91, rr:'1:3', entry:2342, sl:2242, tp1:2422, tp2:2502, tp3:2582, status:'Hit Full TP', mode:'Swing', hit_tp1:true, hit_tp2:true, hit_tp3:true },
    { id:'2', created_at:'2026-05-11T14:20:00Z', asset:'EURUSD', signal_type:'SELL', risk_level:'MEDIUM RISK', confidence:83, rr:'1:2.5', entry:1.0834, sl:1.0934, tp1:1.0784, tp2:1.0734, tp3:1.0684, status:'Hit TP2', mode:'Swing', hit_tp1:true, hit_tp2:true, hit_tp3:false },
    { id:'3', created_at:'2026-05-10T11:00:00Z', asset:'GBPUSD', signal_type:'BUY LIMIT', risk_level:'HIGH RISK', confidence:74, rr:'1:2', entry:1.2718, sl:1.2618, tp1:1.2818, tp2:1.2918, tp3:null, status:'Hit SL', mode:'Intraday', hit_tp1:false, hit_tp2:false, hit_sl:true },
    { id:'4', created_at:'2026-05-09T08:15:00Z', asset:'XAUUSD', signal_type:'BUY', risk_level:'LOW RISK', confidence:89, rr:'1:3', entry:2318, sl:2218, tp1:2398, tp2:2478, tp3:2558, status:'Hit TP1', mode:'Swing', hit_tp1:true, hit_tp2:false },
    { id:'5', created_at:'2026-05-08T16:45:00Z', asset:'USDJPY', signal_type:'SELL', risk_level:'ELITE', confidence:96, rr:'1:3', entry:154.32, sl:156.32, tp1:152.32, tp2:150.32, tp3:148.32, status:'Hit Full TP', mode:'Swing', hit_tp1:true, hit_tp2:true, hit_tp3:true },
    { id:'6', created_at:'2026-04-28T10:00:00Z', asset:'XAUUSD', signal_type:'SELL', risk_level:'MEDIUM RISK', confidence:82, rr:'1:2.5', entry:2380, sl:2430, tp1:2330, tp2:2280, tp3:2230, status:'Hit BE', mode:'Swing', hit_tp1:true, hit_be:true },
    { id:'7', created_at:'2026-04-25T09:00:00Z', asset:'EURUSD', signal_type:'BUY', risk_level:'LOW RISK', confidence:88, rr:'1:3', entry:1.0756, sl:1.0656, tp1:1.0856, tp2:1.0956, tp3:1.1056, status:'Hit Full TP', mode:'Swing', hit_tp1:true, hit_tp2:true, hit_tp3:true },
    { id:'8', created_at:'2026-04-20T13:30:00Z', asset:'BTCUSD', signal_type:'BUY', risk_level:'MEDIUM RISK', confidence:81, rr:'1:2.5', entry:62000, sl:60000, tp1:64000, tp2:66000, tp3:68000, status:'Active', mode:'Swing' },
  ];

  if (isAdmin) return all;
  if (plan === 'elite') {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return all.filter(s => new Date(s.created_at) >= start);
  }
  if (plan === 'pro') return all.slice(0, 5);
  return [];
}

function getDemoStats() {
  return { total: 47, wins: 37, losses: 8, be: 2, active: 3, winRate: 78, fullTPs: 18 };
}

// ============================================
// RENDER SIGNAL HISTORY PAGE
// ============================================
function renderHistoryPage(plan, isAdmin) {
  const container = document.getElementById('history-container');
  if (!container) return;

  getSignals(plan, isAdmin).then(({ signals, stats }) => {
    const statsHTML = renderStats(stats);
    const canSeeSignals = isAdmin || plan === 'elite' || plan === 'pro';

    let signalsHTML = '';

    if (!canSeeSignals) {
      // Free users — blurred
      signalsHTML = renderBlurredSignals();
    } else {
      signalsHTML = signals.map(s => renderSignalCard(s)).join('');
      if (plan === 'pro') {
        signalsHTML += renderUpgradePrompt('elite');
      }
    }

    container.innerHTML = `
      <div style="max-width:900px;margin:0 auto;padding:24px;">
        ${statsHTML}
        <div style="margin-top:24px;">
          <div style="font-size:10px;font-family:'Space Mono',monospace;color:#c8a84b;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
            SIGNAL HISTORY
            <span style="flex:1;height:1px;background:linear-gradient(90deg,#c8a84b30,transparent);"></span>
            ${isAdmin || plan === 'elite' ? renderDateFilter() : ''}
          </div>
          ${signalsHTML}
        </div>
      </div>
    `;
  });
}

function renderStats(stats) {
  return `
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:8px;">
      ${[
        { label:'Win Rate',      val: stats.winRate + '%',  color:'#00ff6a' },
        { label:'Total Signals', val: stats.total,          color:'#ffffff' },
        { label:'Total Wins',    val: stats.wins,           color:'#00ff6a' },
        { label:'Total Losses',  val: stats.losses,         color:'#ff4466' },
        { label:'Breakeven',     val: stats.be,             color:'#c8a84b' },
        { label:'Full TPs',      val: stats.fullTPs,        color:'#c8a84b' },
      ].map(s => `
        <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px 10px;text-align:center;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b25,transparent);"></div>
          <div style="font-size:22px;font-weight:700;font-family:'Space Mono',monospace;color:${s.color};margin-bottom:4px;">${s.val}</div>
          <div style="font-size:9px;font-family:'Space Mono',monospace;color:#1e3040;letter-spacing:0.1em;text-transform:uppercase;">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSignalCard(s) {
  const statusColor = {
    'Active':       '#00ff6a',
    'Waiting':      '#ffffff',
    'Hit TP1':      '#3b82f6',
    'Hit TP2':      '#3b82f6',
    'Hit Full TP':  '#3b82f6',
    'Hit BE':       '#c8a84b',
    'Hit SL':       '#ff4466',
    'Cancelled':    '#ff4466',
  }[s.status] || '#ffffff';

  const riskColor = {
    'HIGH RISK':   '#ff4466',
    'MEDIUM RISK': '#c8a84b',
    'LOW RISK':    '#00ff6a',
    'ELITE':       '#c8a84b',
  }[s.risk_level] || '#ffffff';

  const date = new Date(s.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

  return `
    <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:16px;margin-bottom:8px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b20,transparent);"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:12px;font-weight:700;color:${riskColor};font-family:'Space Mono',monospace;letter-spacing:0.08em;">${s.risk_level}</span>
          <span style="font-size:12px;font-family:'Space Mono',monospace;color:${statusColor};">● ${s.status}</span>
        </div>
        <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;">${date}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
        <div>
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:3px;">SIGNAL</div>
          <div style="font-size:14px;font-weight:700;color:#e0eaf8;">${s.signal_type} ${s.asset}</div>
        </div>
        <div>
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:3px;">CONFIDENCE | RR</div>
          <div style="font-size:13px;font-weight:600;color:#c8a84b;">${s.confidence}% | ${s.rr}</div>
        </div>
        <div>
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:3px;">ENTRY | SL</div>
          <div style="font-size:13px;color:#e0eaf8;">${s.entry} | <span style="color:#ff4466;">${s.sl}</span></div>
        </div>
        <div>
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:3px;">TP1 | TP2 | TP3</div>
          <div style="font-size:12px;color:#3b82f6;">
            <span style="${s.hit_tp1?'color:#3b82f6':'color:#1e3040'}">${s.tp1}</span> |
            <span style="${s.hit_tp2?'color:#3b82f6':'color:#1e3040'}">${s.tp2||'—'}</span> |
            <span style="${s.hit_tp3?'color:#3b82f6':'color:#1e3040'}">${s.tp3||'—'}</span>
          </div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;">
        <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;background:#020408;border:1px solid #0d1820;padding:2px 8px;border-radius:2px;">${s.mode}</span>
        <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;background:#020408;border:1px solid #0d1820;padding:2px 8px;border-radius:2px;">${s.entry_tf || 'H4'} Entry</span>
      </div>
    </div>
  `;
}

function renderBlurredSignals() {
  const blurred = ['BUY XAUUSD','SELL EURUSD','BUY GBPUSD','SELL USDJPY','BUY XAUUSD'];
  return `
    <div style="position:relative;">
      ${blurred.map(s => `
        <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:16px;margin-bottom:8px;filter:blur(4px);user-select:none;pointer-events:none;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:12px;color:#00ff6a;font-family:'Space Mono',monospace;">LOW RISK ● Active</span>
            <span style="font-size:10px;color:#1e3040;font-family:'Space Mono',monospace;">12 May 2026</span>
          </div>
          <div style="font-size:14px;font-weight:700;color:#e0eaf8;">${s}</div>
          <div style="font-size:12px;color:#c8a84b;margin-top:4px;">Confidence: 91% | RR: 1:3</div>
        </div>
      `).join('')}
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,4,8,0.85);border-radius:4px;">
        <div style="font-size:24px;margin-bottom:12px;">🔒</div>
        <div style="font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Signal History Locked</div>
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#3a4a5a;text-align:center;line-height:1.7;margin-bottom:16px;">Upgrade to Pro to see last 5 signals<br>Upgrade to Elite for full history</div>
        <button style="padding:10px 24px;background:#c8a84b;border:none;border-radius:3px;font-size:13px;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:0.12em;color:#020408;cursor:pointer;text-transform:uppercase;">Upgrade Now</button>
      </div>
    </div>
  `;
}

function renderUpgradePrompt(plan) {
  return `
    <div style="background:rgba(200,168,75,0.05);border:1px solid #c8a84b30;border-radius:4px;padding:20px;text-align:center;margin-top:8px;">
      <div style="font-size:12px;font-family:'Space Mono',monospace;color:#c8a84b;letter-spacing:0.1em;margin-bottom:6px;">🔒 SHOWING LAST 5 SIGNALS ONLY</div>
      <div style="font-size:12px;font-family:'Space Mono',monospace;color:#3a4a5a;line-height:1.7;margin-bottom:14px;">Upgrade to Elite to unlock full signal history<br>Current + previous month — no limits</div>
      <button style="padding:10px 24px;background:#c8a84b;border:none;border-radius:3px;font-size:13px;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:0.12em;color:#020408;cursor:pointer;text-transform:uppercase;">Upgrade to Elite</button>
    </div>
  `;
}

function renderDateFilter() {
  const now   = new Date();
  const month = now.toLocaleString('default', { month: 'long' });
  const prev  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'long' });
  return `
    <span style="font-size:10px;font-family:'Space Mono',monospace;color:#3a4a5a;">
      ${prev} 1 — ${month} ${now.getDate()}
    </span>
  `;
}

// Export
window.ZaevoryqHistory = {
  saveSignal,
  updateSignalStatus,
  getSignals,
  getStats,
  renderHistoryPage,
};

console.log('ZAEVORYQ AI — Signal History Engine Loaded ✅');
