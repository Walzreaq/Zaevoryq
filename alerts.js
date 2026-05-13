// ZAEVORYQ AI — Push Notification Alert System
// All plans get alerts — New Signal, Status Updates, News Alerts

// ============================================
// REQUEST PUSH NOTIFICATION PERMISSION
// ============================================
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('ZAEVORYQ AI — Push notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('ZAEVORYQ AI — Push notifications enabled ✅');
      showWelcomeNotification();
      return true;
    }
  }

  console.warn('ZAEVORYQ AI — Push notifications denied');
  return false;
}

// ============================================
// WELCOME NOTIFICATION
// ============================================
function showWelcomeNotification() {
  sendPushNotification(
    '🎯 ZAEVORYQ AI Alerts Active',
    'You will now receive signal alerts, status updates and news warnings.',
    { icon: 'logo.png', tag: 'welcome' }
  );
}

// ============================================
// CORE PUSH NOTIFICATION SENDER
// ============================================
function sendPushNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;

  const defaultOptions = {
    icon:   '/logo.png',
    badge:  '/logo.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, {
      body,
      ...defaultOptions,
    });

    notification.onclick = () => {
      window.focus();
      if (options.url) window.location.href = options.url;
      notification.close();
    };

    // Auto close after 8 seconds
    setTimeout(() => notification.close(), 8000);

    return notification;
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

// ============================================
// NEW SIGNAL ALERT
// ============================================
function alertNewSignal(signal) {
  const emoji = {
    'BUY':       '📈',
    'SELL':      '📉',
    'BUY LIMIT': '⏳📈',
    'SELL LIMIT':'⏳📉',
  }[signal.signal] || '📊';

  const riskEmoji = {
    'HIGH RISK':   '🔴',
    'MEDIUM RISK': '🟡',
    'LOW RISK':    '🟢',
    'ELITE':       '🔥',
  }[signal.riskLevel] || '⚪';

  sendPushNotification(
    `${emoji} ${signal.signal} ${signal.asset} — ZAEVORYQ AI`,
    `${riskEmoji} ${signal.riskLevel} | Confidence: ${signal.confidence}% | RR: ${signal.rr}\nEntry: ${signal.entry} | SL: ${signal.sl} | TP1: ${signal.tp1}`,
    {
      tag:  `signal_${signal.asset}`,
      url:  '/dashboard.html',
      requireInteraction: true,
      data: { signalId: signal.id },
    }
  );

  // Also show in-app notification
  showInAppAlert({
    type:    'signal',
    title:   `${emoji} NEW SIGNAL — ${signal.signal} ${signal.asset}`,
    message: `${riskEmoji} ${signal.riskLevel} | Confidence: ${signal.confidence}% | Entry: ${signal.entry}`,
    color:   signal.signal.includes('BUY') ? '#00ff6a' : '#ff4466',
  });
}

// ============================================
// STATUS UPDATE ALERTS
// ============================================
function alertStatusUpdate(signal, newStatus) {
  const alerts = {
    'Hit TP1': {
      emoji:   '🔵',
      title:   `TP1 HIT — ${signal.asset}`,
      message: `First target reached at ${signal.tp1}. Consider moving SL to breakeven.`,
      color:   '#3b82f6',
    },
    'Hit TP2': {
      emoji:   '🔵',
      title:   `TP2 HIT — ${signal.asset}`,
      message: `Second target reached at ${signal.tp2}. Move SL to TP1 (${signal.tp1}).`,
      color:   '#3b82f6',
    },
    'Hit Full TP': {
      emoji:   '🔥',
      title:   `FULL TP HIT — ${signal.asset} 🎉`,
      message: `All targets reached! Trade closed in full profit. ZAEVORYQ AI delivers!`,
      color:   '#c8a84b',
    },
    'Hit BE': {
      emoji:   '🟡',
      title:   `BREAKEVEN — ${signal.asset}`,
      message: `Price hit breakeven at ${signal.be}. Trade closed at partial profit.`,
      color:   '#c8a84b',
    },
    'Hit SL': {
      emoji:   '🔴',
      title:   `SL HIT — ${signal.asset}`,
      message: `Stop loss hit at ${signal.sl}. AI is learning from this trade.`,
      color:   '#ff4466',
    },
    'Cancelled': {
      emoji:   '❌',
      title:   `SIGNAL CANCELLED — ${signal.asset}`,
      message: `Limit order cancelled. Setup invalidated by AI.`,
      color:   '#ff4466',
    },
  };

  const alertData = alerts[newStatus];
  if (!alertData) return;

  sendPushNotification(
    `${alertData.emoji} ${alertData.title} — ZAEVORYQ AI`,
    alertData.message,
    {
      tag: `status_${signal.asset}_${newStatus}`,
      url: '/dashboard.html',
      requireInteraction: newStatus === 'Hit Full TP',
    }
  );

  showInAppAlert({
    type:    'status',
    title:   `${alertData.emoji} ${alertData.title}`,
    message: alertData.message,
    color:   alertData.color,
  });
}

// ============================================
// BE LEVEL ALERTS
// ============================================
function alertBEUpdate(signal, beLevel, bePrice) {
  const isLevel2 = beLevel === 2;

  sendPushNotification(
    `🟡 MOVE SL — ${signal.asset} — ZAEVORYQ AI`,
    isLevel2
      ? `BE Level 2 activated! Move SL to TP1 (${signal.tp1}) — ${signal.rr} profit locked!`
      : `BE Level 1 activated! Move SL to ${bePrice} — Trade is now risk free!`,
    {
      tag: `be_${signal.asset}_${beLevel}`,
      url: '/dashboard.html',
      requireInteraction: true,
    }
  );

  showInAppAlert({
    type:    'be',
    title:   `🟡 MOVE YOUR SL — ${signal.asset}`,
    message: isLevel2
      ? `Move SL to TP1 (${signal.tp1}) — Profit secured!`
      : `Move SL to ${bePrice} — Trade is risk free!`,
    color:   '#c8a84b',
    urgent:  true,
  });
}

// ============================================
// NEWS ALERTS
// ============================================
function alertNewsWarning(newsEvent, minsAway) {
  const isUrgent = minsAway <= 8;

  sendPushNotification(
    `${isUrgent ? '⚠️ URGENT' : '🔔'} NEWS IN ${minsAway} MINS — ZAEVORYQ AI`,
    `${newsEvent.event} (${newsEvent.currency}) — HIGH IMPACT\nForecast: ${newsEvent.forecast} | Previous: ${newsEvent.previous}`,
    {
      tag: `news_${newsEvent.event}`,
      url: '/dashboard.html',
      requireInteraction: isUrgent,
    }
  );

  showInAppAlert({
    type:    'news',
    title:   `${isUrgent ? '⚠️ URGENT' : '🔔'} NEWS ALERT — ${minsAway} MINS`,
    message: `${newsEvent.event} (${newsEvent.currency}) — HIGH IMPACT`,
    color:   isUrgent ? '#ff4466' : '#c8a84b',
    urgent:  isUrgent,
  });
}

// ============================================
// IN-APP ALERT TOAST
// ============================================
function showInAppAlert({ type, title, message, color, urgent = false }) {
  // Remove existing alerts of same type
  const existing = document.querySelector(`.zv-toast-${type}`);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `zv-toast zv-toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 70px;
    right: 20px;
    z-index: 9999;
    background: #010305;
    border: 1px solid ${color}60;
    border-left: 3px solid ${color};
    border-radius: 4px;
    padding: 14px 18px;
    max-width: 340px;
    min-width: 280px;
    font-family: 'Rajdhani', sans-serif;
    color: #e0eaf8;
    box-shadow: 0 4px 24px rgba(0,0,0,0.6);
    animation: slideInRight 0.3s ease;
    cursor: pointer;
  `;

  toast.innerHTML = `
    <style>
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
    </style>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:${color};letter-spacing:0.08em;margin-bottom:5px;text-transform:uppercase;">${title}</div>
        <div style="font-size:12px;color:#8a9ab0;line-height:1.5;font-weight:500;">${message}</div>
      </div>
      <div style="font-size:16px;color:#1e3040;cursor:pointer;flex-shrink:0;" onclick="this.parentElement.parentElement.remove()">✕</div>
    </div>
    ${urgent ? `<div style="font-size:10px;color:${color};font-family:'Space Mono',monospace;margin-top:8px;letter-spacing:0.08em;">⚠️ REQUIRES ATTENTION</div>` : ''}
  `;

  toast.onclick = () => toast.remove();
  document.body.appendChild(toast);

  // Auto remove
  const timeout = urgent ? 15000 : 8000;
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, timeout);
}

// ============================================
// NOTIFICATION SETTINGS UI
// ============================================
function renderNotificationSettings(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const enabled = Notification.permission === 'granted';

  container.innerHTML = `
    <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:16px;">
      <div style="font-size:10px;font-weight:700;color:#c8a84b;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace;margin-bottom:14px;">
        🔔 PUSH NOTIFICATIONS
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:#e0eaf8;">Signal Alerts</div>
          <div style="font-size:11px;color:#3a4a5a;font-family:'Space Mono',monospace;">New signals from ZAEVORYQ AI</div>
        </div>
        <div style="width:36px;height:20px;border-radius:10px;background:${enabled?'#00ff6a':'#1e3040'};cursor:pointer;position:relative;" onclick="toggleNotifications()">
          <div style="width:16px;height:16px;border-radius:50%;background:#ffffff;position:absolute;top:2px;${enabled?'right:2px':'left:2px'};transition:all 0.2s;"></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:#e0eaf8;">Status Updates</div>
          <div style="font-size:11px;color:#3a4a5a;font-family:'Space Mono',monospace;">TP1, TP2, Full TP, BE, SL</div>
        </div>
        <div style="width:36px;height:20px;border-radius:10px;background:${enabled?'#00ff6a':'#1e3040'};position:relative;">
          <div style="width:16px;height:16px;border-radius:50%;background:#ffffff;position:absolute;top:2px;${enabled?'right:2px':'left:2px'};"></div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div>
          <div style="font-size:13px;font-weight:600;color:#e0eaf8;">News Warnings</div>
          <div style="font-size:11px;color:#3a4a5a;font-family:'Space Mono',monospace;">1 hour before high impact news</div>
        </div>
        <div style="width:36px;height:20px;border-radius:10px;background:${enabled?'#00ff6a':'#1e3040'};position:relative;">
          <div style="width:16px;height:16px;border-radius:50%;background:#ffffff;position:absolute;top:2px;${enabled?'right:2px':'left:2px'};"></div>
        </div>
      </div>
      ${!enabled ? `
        <button onclick="enableNotifications()" style="width:100%;padding:10px;background:#c8a84b;border:none;border-radius:3px;font-size:13px;font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:0.12em;color:#020408;cursor:pointer;text-transform:uppercase;">
          Enable Notifications
        </button>
      ` : `
        <div style="font-size:11px;font-family:'Space Mono',monospace;color:#00ff6a;text-align:center;letter-spacing:0.08em;">✓ Notifications Active</div>
      `}
    </div>
  `;
}

async function enableNotifications() {
  const granted = await requestNotificationPermission();
  if (granted) {
    renderNotificationSettings('notification-settings');
  }
}

async function toggleNotifications() {
  if (Notification.permission !== 'granted') {
    await requestNotificationPermission();
  }
  renderNotificationSettings('notification-settings');
}

// Auto request permission on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(requestNotificationPermission, 3000);
});

// Export
window.ZaevoryqAlerts = {
  requestNotificationPermission,
  alertNewSignal,
  alertStatusUpdate,
  alertBEUpdate,
  alertNewsWarning,
  showInAppAlert,
  renderNotificationSettings,
};


// ============================================
// STANDBY ALERT SYSTEM
// Elite + Admin only — 5 mins before signal
// ============================================

// Track standby states to avoid duplicate alerts
let standbyAlerts = {};

// Check if user can receive standby alerts
function canReceiveStandby() {
  const plan    = window.ZaevoryqUser?.plan || 'free';
  const isAdmin = window.ZaevoryqUser?.email === 'walzreaq@gmail.com';
  return isAdmin || plan === 'elite';
}

// Detect potential setup forming (pre-signal check)
function detectPotentialSetup(asset, allTimeframeData, mode = 'swing') {
  if (!canReceiveStandby()) return null;

  const primaryTF = mode === 'scalping' ? 'M15' : mode === 'intraday' ? 'H1' : 'H4';
  const candles   = allTimeframeData[primaryTF];
  if (!candles || candles.length < 20) return null;

  // Run 3 core checks for standby trigger
  const structure = window.ZaevoryqSignal?.analyzeMarketStructure(candles);
  const supdem    = window.ZaevoryqSignal?.analyzeSupplyDemand(candles);
  const trend     = window.ZaevoryqSignal?.analyzeTrend(candles);

  if (!structure || !supdem || !trend) return null;

  // Need all 3 to agree on same direction
  const directions = [structure.direction, supdem.direction, trend.direction];
  const bullCount  = directions.filter(d => d === 'bullish').length;
  const bearCount  = directions.filter(d => d === 'bearish').length;

  if (bullCount < 3 && bearCount < 3) return null;

  const direction     = bullCount >= bearCount ? 'bullish' : 'bearish';
  const signalType    = direction === 'bullish' ? 'BUY' : 'SELL';
  const buildingConf  = Math.round((structure.score + supdem.score + trend.score) * 0.8);

  // Avoid duplicate standby for same asset
  const key = `${asset}_${signalType}`;
  if (standbyAlerts[key]) return null;

  return { asset, signalType, buildingConf, direction };
}

// Send standby alert — Elite + Admin only
function alertStandby(asset, signalType, buildingConfidence) {
  if (!canReceiveStandby()) return;

  const key = `${asset}_${signalType}`;
  if (standbyAlerts[key]) return;

  // Mark as sent
  standbyAlerts[key] = true;

  // Clear standby after 10 minutes
  setTimeout(() => {
    delete standbyAlerts[key];
  }, 10 * 60 * 1000);

  const direction = signalType.includes('BUY') ? '📈' : '📉';

  // Push notification
  sendPushNotification(
    `🟡 STANDBY — ${signalType} ${asset} FORMING`,
    `Potential ${signalType} setup detected on ${asset}\nConfidence building: ${buildingConfidence}%\nStand by — signal may be issued in ~5 mins`,
    {
      tag:  `standby_${asset}`,
      url:  '/dashboard.html',
      requireInteraction: true,
      vibrate: [100, 50, 100, 50, 100],
    }
  );

  // In-app alert
  showInAppAlert({
    type:    'standby',
    title:   `🟡 STANDBY ALERT — ${signalType} ${asset}`,
    message: `${direction} Potential setup forming — Confidence building: ${buildingConfidence}%\nStand by for signal in ~5 mins`,
    color:   '#c8a84b',
    urgent:  true,
  });

  console.log(`ZAEVORYQ AI — Standby alert sent: ${signalType} ${asset}`);
}

// Alert when standby setup is invalidated
function alertStandbyInvalidated(asset, signalType) {
  if (!canReceiveStandby()) return;

  const key = `${asset}_${signalType}`;
  delete standbyAlerts[key];

  sendPushNotification(
    `❌ SETUP INVALIDATED — ${asset}`,
    `The potential ${signalType} ${asset} setup did not confirm.\nNo signal will be issued.`,
    { tag: `standby_cancel_${asset}`, url: '/dashboard.html' }
  );

  showInAppAlert({
    type:    'standby_cancel',
    title:   `❌ SETUP INVALIDATED — ${asset}`,
    message: `${signalType} ${asset} setup did not confirm — No signal issued`,
    color:   '#ff4466',
    urgent:  false,
  });
}

// Main standby monitoring loop
// Runs every 5 minutes to check all assets
function startStandbyMonitor(allAssetsData) {
  if (!canReceiveStandby()) return;

  const assets = ['XAUUSD','EURUSD','GBPUSD','USDJPY','XAGUSD','NAS100','SPX500','USOIL','BTCUSD'];
  const modes  = ['swing','intraday','scalping'];

  assets.forEach(asset => {
    if (!allAssetsData[asset]) return;

    modes.forEach(mode => {
      const potential = detectPotentialSetup(asset, allAssetsData[asset], mode);
      if (potential) {
        alertStandby(potential.asset, potential.signalType, potential.buildingConf);

        // After 5 mins check if signal confirmed or invalidated
        setTimeout(async () => {
          if (window.ZaevoryqData) {
            const freshData = await window.ZaevoryqData.getAllTimeframes(asset);
            const signal    = window.ZaevoryqSignal?.generateSignal(asset, freshData, mode);

            if (signal?.signal) {
              // Signal confirmed — full alert will fire from signal engine
              console.log(`ZAEVORYQ AI — Standby confirmed: ${signal.signal} ${asset}`);
            } else {
              // Setup invalidated
              alertStandbyInvalidated(asset, potential.signalType);
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
      }
    });
  });
}

// Add standby to exports
window.ZaevoryqAlerts.alertStandby          = alertStandby;
window.ZaevoryqAlerts.alertStandbyInvalidated = alertStandbyInvalidated;
window.ZaevoryqAlerts.startStandbyMonitor   = startStandbyMonitor;
window.ZaevoryqAlerts.canReceiveStandby     = canReceiveStandby;
window.ZaevoryqAlerts.detectPotentialSetup  = detectPotentialSetup;

console.log('ZAEVORYQ AI — Standby Alert System Loaded ✅');

console.log('ZAEVORYQ AI — Alert System Loaded ✅');
