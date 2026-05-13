// ZAEVORYQ AI — Signal History & Win/Loss Tracker
// Powered by Supabase

const sb = window.ZaevoryqAuth?.supabase;

// ============================================
// SAVE SIGNAL TO DATABASE
// ============================================
async function saveSignal(signal) {
  if (!sb) return;
  try {
    const { error } = await sb.from('signals').insert([{
      asset:       signal.asset,
      signal_type: signal.signal,
      confidence:  signal.confidence,
      risk_level:  signal.riskLevel,
      rr:          signal.rr,
      entry:       signal.entry,
      sl:          signal.sl,
      tp1:         signal.tp1,
      tp2:         signal.tp2,
      tp3:         signal.tp3,
      mode:        signal.mode,
      entry_tf:    signal.entryTF,
      trend_tf:    signal.trendTF,
      reasons:     signal.reasons?.join(', '),
      status:      'Active',
      created_at:  new Date().toISOString(),
    }]);
    if (error) console.warn('Signal save error:', error.message);
    else console.log('ZAEVORYQ AI — Signal saved ✅');
  } catch (err) {
    console.warn('Signal save error:', err);
  }
}

// ============================================
// UPDATE SIGNAL STATUS
// ============================================
async function updateSignalStatus(signalId, status, bePrice = null) {
  if (!sb) return;
  try {
    const updates = { status, updated_at: new Date().toISOString() };
    if (bePrice) updates.be_price = bePrice;
    if (status === 'Hit SL') updates.result = 'loss';
    else if (status === 'Hit Full TP') updates.result = 'win';
    else if (status.includes('Hit TP')) updates.result = 'win';
    else if (status === 'Hit BE') updates.result = 'breakeven';

    const { error } = await sb.from('signals').update(updates).eq('id', signalId);
    if (error) console.warn('Status update error:', error.message);
  } catch (err) {
    console.warn('Status update error:', err);
  }
}

// ============================================
// FETCH SIGNALS BASED ON PLAN
// ============================================
async function fetchSignals(plan = 'free', isAdmin = false) {
  if (!sb) return getDemoSignals(plan, isAdmin);
  try {
    let query = sb.from('signals').select('*').order('created_at', { ascending: false });

    if (isAdmin) {
      // Admin sees everything
    } else if (plan === 'elite') {
      // Elite sees current + previous month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      query = query.gte('created_at', firstDay.toISOString());
    } else if (plan === 'pro') {
      // Pro sees last 5 signals only
      query = query.limit(5);
    } else {
      // Free sees no signals — just stats
      return { signals: [], stats: await fetchStats() };
    }

    const { data, error } = await query;
    if (error) throw error;
    return { signals: data || [], stats: calculateStats(data || []) };
  } catch (err) {
    console.warn('Fetch signals error:', err);
    return getDemoSignals(plan, isAdmin);
  }
}

// ============================================
// FETCH OVERALL STATS
// ============================================
async function fetchStats() {
  if (!sb) return getDemoStats();
  try {
    const { data, error } = await sb.from('signals').select('result, confidence, rr');
    if (error) throw error;
    return calculateStats(data || []);
  } catch (err) {
    return getDemoStats();
  }
}

// ============================================
// CALCULATE STATS
// ============================================
function calculateStats(signals) {
  const total     = signals.length;
  const wins      = signals.filter(s => s.result === 'win').length;
  const losses    = signals.filter(s => s.result === 'loss').length;
  const breakeven = signals.filter(s => s.result === 'breakeven').length;
  const winRate   = total > 0 ? Math.round((wins / total) * 100) : 0;
  const avgConf   = total > 0 ? Math.round(signals.reduce((s,c) => s + (c.confidence||0), 0) / total) : 0;

  return { total, wins, losses, breakeven, winRate, avgConf };
}

// ============================================
// DEMO DATA
// ============================================
function getDemoStats() {
  return { total: 47, wins: 37, losses: 8, breakeven: 2, winRate: 78, avgConf: 86 };
}

function getDemoSignals(plan, isAdmin) {
  const allSignals = [
    { id:1, asset:'XAUUSD', signal_type:'BUY', confidence:91, risk_level:'LOW RISK', rr:'1:3', entry:2342, sl:2242, tp1:2422, tp2:2502, tp3:2582, status:'Hit Full TP', result:'win', mode:'Swing', created_at:'2026-05-12T09:30:00Z' },
    { id:2, asset:'EURUSD', signal_type:'SELL', confidence:83, risk_level:'MEDIUM RISK', rr:'1:2.5', entry:1.0834, sl:1.0934, tp1:1.0784, tp2:1.0734, tp3:1.0684, status:'Hit TP2', result:'win', mode:'Swing', created_at:'2026-05-11T14:20:00Z' },
    { id:3, asset:'GBPUSD', signal_type:'BUY LIMIT', confidence:74, risk_level:'HIGH RISK', rr:'1:2', entry:1.2718, sl:1.2618, tp1:1.2818, tp2:1.2918, tp3:null, status:'Hit SL', result:'loss', mode:'Intraday', created_at:'2026-05-10T10:15:00Z' },
    { id:4, asset:'XAUUSD', signal_type:'BUY', confidence:88, risk_level:'LOW RISK', rr:'1:3', entry:2318, sl:2218, tp1:2398, tp2:2478, tp3:2558, status:'Hit TP1', result:'win', mode:'Swing', created_at:'2026-05-09T08:45:00Z' },
    { id:5, asset:'USDJPY', signal_type:'SELL', confidence:85, risk_level:'MEDIUM RISK', rr:'1:2.5', entry:154.32, sl:155.32, tp1:153.32, tp2:152.32, tp3:151.32, status:'Active', result:null, mode:'Swing', created_at:'2026-05-08T11:30:00Z' },
    { id:6, asset:'XAUUSD', signal_type:'BUY', confidence:96, risk_level:'ELITE', rr:'1:3', entry:2290, sl:2190, tp1:2370, tp2:2450, tp3:2530, status:'Hit Full TP', result:'win', mode:'Swing', created_at:'2026-04-28T09:00:00Z' },
    { id:7, asset:'EURUSD', signal_type:'BUY LIMIT', confidence:82, risk_level:'MEDIUM RISK', rr:'1:2.5', entry:1.0780, sl:1.0680, tp1:1.0830, tp2:1.0880, tp3:1.0930, status:'Hit BE', result:'breakeven', mode:'Intraday', created_at:'2026-04-25T13:00:00Z' },
    { id:8, asset:'BTCUSD', signal_type:'BUY', confidence:79, risk_level:'HIGH RISK', rr:'1:2', entry:62000, sl:61000, tp1:63000, tp2:64000, tp3:null, status:'Hit TP2', result:'win', mode:'Swing', created_at:'2026-04-20T10:00:00Z' },
  ];

  if (isAdmin) return { signals: allSignals, stats: getDemoStats() };

  if (plan === 'elite') {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const filtered = allSignals.filter(s => new Date(s.created_at) >= firstDay);
    return { signals: filtered, stats: getDemoStats() };
  }

  if (plan === 'pro') {
    return { signals: allSignals.slice(0, 5), stats: getDemoStats() };
  }

  return { signals: [], stats: getDemoStats() };
}

// ============================================
// RENDER SIGNAL HISTORY PAGE
// ============================================
function getStatusColor(status) {
  if (!status) return '#c8a84b';
  if (status === 'Active') return '#00ff6a';
  if (status.includes('TP')) return '#3b82f6';
  if (status === 'Hit BE') return '#ffcc00';
  if (status === 'Hit SL') return '#ff4466';
  if (status === 'Cancelled') return '#ff4466';
  if (status === 'Waiting') return '#c8d6e8';
  return '#c8a84b';
}

function getRiskColor(risk) {
  if (!risk) return '#c8a84b';
  if (risk === 'ELITE') return '#ffcc00';
  if (risk === 'LOW RISK') return '#00ff6a';
  if (risk === 'MEDIUM RISK') return '#c8a84b';
  if (risk === 'HIGH RISK') return '#ff4466';
  return '#c8a84b';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function renderSignalCard(signal, blurred = false) {
  const statusColor = getStatusColor(signal.status);
  const riskColor   = getRiskColor(signal.risk_level);

  if (blurred) {
    return `
      <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px 16px;margin-bottom:8px;filter:blur(4px);user-select:none;pointer-events:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:#c8a84b;font-family:'Space Mono',monospace;">██ ██████ SIGNAL</span>
          <span style="font-size:11px;font-family:'Space Mono',monospace;color:#3b82f6;">██ ██████</span>
        </div>
        <div style="font-size:13px;color:#e0eaf8;font-weight:600;margin-bottom:6px;">███ ██████</div>
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#5a6a7a;">
          Entry: ████ | SL: ████ | TP1: ████
        </div>
      </div>`;
  }

  return `
    <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px 16px;margin-bottom:8px;position:relative;overflow:hidden;transition:border-color 0.2s;" onmouseover="this.style.borderColor='#c8a84b30'" onmouseout="this.style.borderColor='#0d1820'">
      <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,${riskColor}30,transparent);"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:700;color:${riskColor};font-family:'Space Mono',monospace;letter-spacing:0.1em;">${signal.risk_level || 'SIGNAL'}</span>
        <span style="font-size:11px;font-family:'Space Mono',monospace;color:${statusColor};letter-spacing:0.08em;">${signal.status || 'Active'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <span style="font-size:14px;color:#e0eaf8;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:0.08em;">${signal.signal_type} ${signal.asset}</span>
          <span style="font-size:11px;font-family:'Space Mono',monospace;color:#5a6a7a;margin-left:10px;">Conf: ${signal.confidence}% | RR: ${signal.rr}</span>
        </div>
        <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;">${formatDate(signal.created_at)}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
        <div style="background:#020408;border-radius:3px;padding:6px 8px;">
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:2px;">ENTRY</div>
          <div style="font-size:12px;color:#c8d6e8;font-family:'Space Mono',monospace;">${signal.entry}</div>
        </div>
        <div style="background:#020408;border-radius:3px;padding:6px 8px;">
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:2px;">SL</div>
          <div style="font-size:12px;color:#ff4466;font-family:'Space Mono',monospace;">${signal.sl}</div>
        </div>
        <div style="background:#020408;border-radius:3px;padding:6px 8px;">
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:2px;">TP1</div>
          <div style="font-size:12px;color:#00ff6a;font-family:'Space Mono',monospace;">${signal.tp1}</div>
        </div>
        <div style="background:#020408;border-radius:3px;padding:6px 8px;">
          <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:2px;">TP3</div>
          <div style="font-size:12px;color:#00ff6a;font-family:'Space Mono',monospace;">${signal.tp3 || signal.tp2 || '—'}</div>
        </div>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;">
        <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;background:#020408;padding:3px 8px;border-radius:2px;border:1px solid #0d1820;">${signal.mode || 'Swing'}</span>
      </div>
    </div>`;
}

function renderHistoryPage(plan, isAdmin, data) {
  const { signals, stats } = data;
  const container = document.getElementById('signal-history-container');
  if (!container) return;

  // Stats section (visible to all)
  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
      <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b30,transparent);"></div>
        <div style="font-size:28px;font-weight:700;font-family:'Space Mono',monospace;color:#00ff6a;">${stats.winRate}%</div>
        <div style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;letter-spacing:0.1em;margin-top:4px;">WIN RATE</div>
      </div>
      <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b30,transparent);"></div>
        <div style="font-size:28px;font-weight:700;font-family:'Space Mono',monospace;color:#ffffff;">${stats.total}</div>
        <div style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;letter-spacing:0.1em;margin-top:4px;">TOTAL SIGNALS</div>
      </div>
      <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:14px;text-align:center;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b30,transparent);"></div>
        <div style="font-size:18px;font-weight:700;font-family:'Space Mono',monospace;color:#c8a84b;margin-top:4px;">
          <span style="color:#00ff6a;">${stats.wins}W</span> / <span style="color:#ff4466;">${stats.losses}L</span> / <span style="color:#ffcc00;">${stats.breakeven}BE</span>
        </div>
        <div style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;letter-spacing:0.1em;margin-top:4px;">W / L / BE</div>
      </div>
    </div>`;

  // Signal list based on plan
  let signalsHtml = '';

  if (plan === 'free' || plan === 'pro' && signals.length === 0) {
    // Show 3 blurred signals
    signalsHtml = `
      <div style="position:relative;">
        ${renderSignalCard({asset:'XAUUSD',signal_type:'BUY',confidence:91,risk_level:'LOW RISK',rr:'1:3',entry:2342,sl:2242,tp1:2422,tp2:2502,tp3:2582,status:'Hit Full TP',mode:'Swing',created_at:new Date().toISOString()}, true)}
        ${renderSignalCard({asset:'EURUSD',signal_type:'SELL',confidence:83,risk_level:'MEDIUM RISK',rr:'1:2.5',entry:1.0834,sl:1.0934,tp1:1.0784,tp2:1.0734,tp3:null,status:'Hit TP2',mode:'Swing',created_at:new Date().toISOString()}, true)}
        ${renderSignalCard({asset:'GBPUSD',signal_type:'BUY',confidence:74,risk_level:'HIGH RISK',rr:'1:2',entry:1.2718,sl:1.2618,tp1:1.2818,tp2:null,tp3:null,status:'Hit SL',mode:'Intraday',created_at:new Date().toISOString()}, true)}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(2,4,8,0.85);border-radius:4px;border:1px solid #c8a84b30;">
          <div style="font-size:20px;margin-bottom:10px;">🔒</div>
          <div style="font-size:14px;font-weight:700;color:#ffffff;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Signal History Locked</div>
          <div style="font-size:11px;font-family:'Space Mono',monospace;color:#3a4a5a;text-align:center;line-height:1.6;margin-bottom:14px;">Upgrade to Pro to see<br>your last 5 signals</div>
          <button style="padding:10px 24px;background:#c8a84b;border:none;border-radius:3px;font-size:13px;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:0.14em;text-transform:uppercase;color:#020408;cursor:pointer;" onclick="window.location.href='login.html'">Upgrade to Pro</button>
        </div>
      </div>`;
  } else if (plan === 'pro') {
    signalsHtml = `
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#c8a84b;letter-spacing:0.12em;margin-bottom:12px;">LAST 5 SIGNALS</div>
      ${signals.map(s => renderSignalCard(s)).join('')}
      <div style="background:rgba(200,168,75,0.04);border:1px solid #c8a84b25;border-radius:4px;padding:12px 16px;text-align:center;margin-top:8px;">
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#c8a84b;margin-bottom:4px;">🔒 Want full history?</div>
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#3a4a5a;">Upgrade to Elite for 2 months of signal history</div>
      </div>`;
  } else {
    // Elite or Admin
    const now = new Date();
    const monthName = now.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    const prevMonth = new Date(now.getFullYear(), now.getMonth()-1, 1).toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    const label = isAdmin ? 'ALL TIME HISTORY' : `${prevMonth} — ${monthName}`;

    signalsHtml = `
      <div style="font-size:10px;font-family:'Space Mono',monospace;color:#c8a84b;letter-spacing:0.12em;margin-bottom:12px;">${label} · ${signals.length} SIGNALS</div>
      ${signals.map(s => renderSignalCard(s)).join('')}`;
  }

  container.innerHTML = statsHtml + signalsHtml;
}

// Export
window.ZaevoryqHistory = {
  saveSignal,
  updateSignalStatus,
  fetchSignals,
  fetchStats,
  renderHistoryPage,
  calculateStats,
};

console.log('ZAEVORYQ AI — Signal History Engine Loaded ✅');
