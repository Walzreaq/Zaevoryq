// ZAEVORYQ AI — News Fetcher Engine
// Forex Factory (USD High Impact) + Geopolitical News

// ============================================
// FOREX FACTORY NEWS FETCHER
// ============================================

// We use a CORS proxy to fetch Forex Factory RSS feed
const FF_RSS = 'https://api.allorigins.win/get?url=' + 
  encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json');

// Geopolitical news via GNews API (free tier)
const GNEWS_KEY = 'pub_free'; // Will use RSS fallback
const GEO_KEYWORDS = [
  'oil price', 'OPEC', 'Iran sanctions', 'Russia Ukraine',
  'Red Sea shipping', 'Federal Reserve', 'US dollar',
  'geopolitical risk', 'gold rally', 'market crash',
  'interest rate', 'inflation', 'recession'
];


// Currency to asset mapping
const CURRENCY_ASSET_MAP = {
  'USD': 'EURUSD, GBPUSD, USDJPY, XAUUSD, NAS100, SPX500, USOIL, BTCUSD',
  'EUR': 'EURUSD',
  'GBP': 'GBPUSD',
  'JPY': 'USDJPY',
  'XAU': 'XAUUSD',
};

// Store news data
let forexNews = [];
let geoNews   = [];
let alertsSent = new Set();

// ============================================
// FETCH FOREX FACTORY USD HIGH IMPACT NEWS
// ============================================
async function fetchForexFactoryNews() {
  try {
    const res  = await fetch(FF_RSS);
    const data = await res.json();
    const events = JSON.parse(data.contents);

    // Filter USD + High Impact only
    forexNews = events
      .filter(e => ['USD','EUR','GBP','JPY','XAU'].includes(e.currency) && e.impact === 'High')
      .map(e => ({
        time:     e.date,
        currency: e.currency,
        event:    e.title,
        impact:   'HIGH',
        forecast: e.forecast || 'N/A',
        previous: e.previous || 'N/A',
        actual:   e.actual   || 'Pending',
      }));

    console.log(`ZAEVORYQ AI — Loaded ${forexNews.length} high impact events (USD/EUR/GBP/JPY/XAU)`);
    renderForexNews();
    checkNewsAlerts();
    return forexNews;

  } catch (err) {
    console.error('Forex Factory fetch error:', err);
    // Fallback demo data
    forexNews = getDemoNews();
    renderForexNews();
    return forexNews;
  }
}

// Demo news for fallback
function getDemoNews() {
  const today = new Date();
  return [
    {
      time:     new Date(new Date().setHours(8, 30)).toISOString(),
      currency: 'EUR',
      event:    'ECB Interest Rate Decision',
      impact:   'HIGH',
      forecast: '4.50%',
      previous: '4.50%',
      actual:   'Pending',
    },
    {
      time:     new Date(new Date().setHours(10, 0)).toISOString(),
      currency: 'GBP',
      event:    'BOE Monetary Policy Report',
      impact:   'HIGH',
      forecast: '5.25%',
      previous: '5.25%',
      actual:   'Pending',
    },
    {
      time:     new Date(new Date().setHours(13, 30)).toISOString(),
      currency: 'USD',
      event:    'Non-Farm Payrolls',
      impact:   'HIGH',
      forecast: '180K',
      previous: '175K',
      actual:   'Pending',
    },
    {
      time:     new Date(new Date().setHours(15, 0)).toISOString(),
      currency: 'USD',
      event:    'ISM Manufacturing PMI',
      impact:   'HIGH',
      forecast: '49.5',
      previous: '48.7',
      actual:   'Pending',
    },
    {
      time:     new Date(new Date().setHours(18, 0)).toISOString(),
      currency: 'USD',
      event:    'FOMC Meeting Minutes',
      impact:   'HIGH',
      forecast: 'N/A',
      previous: 'N/A',
      actual:   'Pending',
    },
    {
      time:     new Date(new Date().setHours(23, 50)).toISOString(),
      currency: 'JPY',
      event:    'BOJ Policy Rate Decision',
      impact:   'HIGH',
      forecast: '0.10%',
      previous: '0.10%',
      actual:   'Pending',
    },
  ];
}

// ============================================
// FETCH GEOPOLITICAL NEWS
// ============================================
async function fetchGeopoliticalNews() {
  try {
    // Use RSS feeds from reliable sources via CORS proxy
    const sources = [
      'https://api.allorigins.win/get?url=' + encodeURIComponent('https://feeds.reuters.com/reuters/businessNews'),
      'https://api.allorigins.win/get?url=' + encodeURIComponent('https://feeds.bbci.co.uk/news/business/rss.xml'),
    ];

    let allNews = [];

    for (const src of sources) {
      try {
        const res  = await fetch(src);
        const data = await res.json();
        const parser = new DOMParser();
        const xml    = parser.parseFromString(data.contents, 'text/xml');
        const items  = xml.querySelectorAll('item');

        items.forEach(item => {
          const title = item.querySelector('title')?.textContent || '';
          const desc  = item.querySelector('description')?.textContent || '';
          const link  = item.querySelector('link')?.textContent || '';
          const date  = item.querySelector('pubDate')?.textContent || '';

          // Check if relevant to forex/commodities
          const isRelevant = GEO_KEYWORDS.some(kw =>
            title.toLowerCase().includes(kw.toLowerCase()) ||
            desc.toLowerCase().includes(kw.toLowerCase())
          );

          if (isRelevant) {
            allNews.push({
              title,
              description: desc.replace(/<[^>]*>/g, '').slice(0, 120) + '...',
              link,
              date,
              source: src.includes('reuters') ? 'Reuters' : 'BBC',
              tags:   getNewsTags(title + desc),
            });
          }
        });
      } catch (e) {
        console.warn('Source fetch failed:', e);
      }
    }

    // Deduplicate and limit
    geoNews = allNews.slice(0, 8);
    console.log(`ZAEVORYQ AI — Loaded ${geoNews.length} geopolitical events`);
    renderGeoNews();
    return geoNews;

  } catch (err) {
    console.error('Geopolitical news fetch error:', err);
    geoNews = getDemoGeoNews();
    renderGeoNews();
    return geoNews;
  }
}

// Get relevant market tags from news
function getNewsTags(text) {
  const tagMap = {
    'oil|opec|crude':           'OIL · USD',
    'iran|sanction':            'IRAN · OIL · USD',
    'russia|ukraine':           'RISK-OFF · USD · XAU',
    'shipping|red sea|freight': 'SHIPPING · EUR · GBP',
    'fed|federal reserve|fomc': 'USD · RATE',
    'gold|xau':                 'XAU · USD',
    'bitcoin|crypto':           'BTC · CRYPTO',
    'inflation|cpi':            'USD · RATE',
    'recession|gdp':            'USD · RISK-OFF',
    'china|trade war':          'USD · JPY · RISK',
  };

  const lc = text.toLowerCase();
  for (const [pattern, tag] of Object.entries(tagMap)) {
    if (new RegExp(pattern).test(lc)) return tag;
  }
  return 'GLOBAL · MARKET';
}

// Demo geopolitical news fallback
function getDemoGeoNews() {
  return [
    {
      title:       'Iran-US Tensions Escalate Near Strait of Hormuz',
      description: 'Rising tensions in the Persian Gulf raising oil supply risk concerns among traders...',
      source:      'Reuters',
      tags:        'OIL · USD · RISK-OFF',
    },
    {
      title:       'Red Sea Shipping Disruptions Continue to Inflate Freight Costs',
      description: 'Houthi attacks on commercial vessels forcing rerouting around Cape of Good Hope...',
      source:      'BBC',
      tags:        'SHIPPING · EUR · GBP',
    },
    {
      title:       'Federal Reserve Officials Signal Cautious Approach to Rate Cuts',
      description: 'Fed members emphasize data dependency as inflation remains above 2% target...',
      source:      'Reuters',
      tags:        'USD · RATE · XAU',
    },
    {
      title:       'Gold Hits New High Amid Safe Haven Demand',
      description: 'XAU/USD surges as geopolitical uncertainty and dollar weakness boost demand...',
      source:      'Reuters',
      tags:        'XAU · USD · SAFE HAVEN',
    },
  ];
}

// ============================================
// NEWS ALERTS — 1 HOUR BEFORE HIGH IMPACT
// ============================================
function checkNewsAlerts() {
  const now = new Date();

  forexNews.forEach(event => {
    const eventTime  = new Date(event.time);
    const diffMins   = (eventTime - now) / 60000;
    const alertKey   = `${event.event}_${event.time}`;

    // Alert 1 hour before (between 55-65 mins)
    if (diffMins >= 55 && diffMins <= 65 && !alertsSent.has(alertKey)) {
      alertsSent.add(alertKey);
      showNewsAlert(event, Math.round(diffMins));
    }

    // Alert 5 mins before
    const alertKey5 = `${alertKey}_5min`;
    if (diffMins >= 3 && diffMins <= 8 && !alertsSent.has(alertKey5)) {
      alertsSent.add(alertKey5);
      showNewsAlert(event, Math.round(diffMins), true);
    }
  });
}

// Show alert notification
function showNewsAlert(event, minsAway, urgent = false) {
  // Create alert element
  const alert = document.createElement('div');
  alert.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    background: ${urgent ? '#2d0f0f' : '#0d1820'};
    border: 1px solid ${urgent ? '#ff4466' : '#c8a84b'};
    border-radius: 6px; padding: 16px 20px; max-width: 320px;
    font-family: 'Space Mono', monospace; color: #e0eaf8;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    animation: slideIn 0.3s ease;
  `;

  alert.innerHTML = `
    <div style="font-size:10px;color:${urgent ? '#ff4466' : '#c8a84b'};letter-spacing:0.14em;margin-bottom:8px;">
      ${urgent ? '⚠️ URGENT' : '🔔'} NEWS ALERT — ${minsAway} MINS
    </div>
    <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${event.event}</div>
    <div style="font-size:11px;color:#64748b;">
      Currency: ${event.currency} · Impact: ${event.impact}<br>
      Affects: ${CURRENCY_ASSET_MAP[event.currency] || event.currency}<br>
      Forecast: ${event.forecast} · Previous: ${event.previous}
    </div>
    ${urgent ? '<div style="font-size:11px;color:#ff4466;margin-top:6px;">⚠️ Consider closing or avoiding new trades</div>' : ''}
    <div style="font-size:10px;color:#1e3040;margin-top:8px;cursor:pointer;" onclick="this.parentElement.remove()">
      DISMISS ✕
    </div>
  `;

  document.body.appendChild(alert);

  // Auto remove after 30 seconds
  setTimeout(() => {
    if (alert.parentElement) alert.remove();
  }, 30000);

  // Also pause AI signals during high impact news
  if (urgent) {
    window.ZaevoryqSignal.pauseSignals = true;
    setTimeout(() => {
      window.ZaevoryqSignal.pauseSignals = false;
    }, 60 * 60 * 1000); // Resume after 1 hour
  }
}

// ============================================
// RENDER NEWS TO DASHBOARD
// ============================================
function renderForexNews() {
  const container = document.getElementById('forex-news-container');
  if (!container) return;

  container.innerHTML = forexNews.map(event => {
    const eventTime = new Date(event.time);
    const timeStr   = eventTime.toLocaleTimeString('en-US', {
      hour:   '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';

    const currColors = {
        'USD': '#3b82f6', 'EUR': '#10b981',
        'GBP': '#8b5cf6', 'JPY': '#f59e0b', 'XAU': '#c8a84b'
      };
      const cc = currColors[event.currency] || '#64748b';
      return `
      <div class="nx-ni">
        <div class="nx-nt">${timeStr} — <span style="color:${cc}">${event.currency}</span></div>
        <div class="nx-ntxt">${event.event}</div>
        <div style="display:flex;gap:6px;margin-top:4px;align-items:center;">
          <span class="nx-nimp nimp-h">HIGH</span>
          <span style="font-size:10px;font-family:'Space Mono',monospace;color:#c8a84b50;margin-left:4px;">
            → ${CURRENCY_ASSET_MAP[event.currency] || event.currency}
          </span>
          <span style="font-size:10px;font-family:'Space Mono',monospace;color:#1e3040;">
            F: ${event.forecast} | P: ${event.previous}
            ${event.actual !== 'Pending' ? ' | A: ' + event.actual : ''}
          </span>
        </div>
      </div>
    `;
  }).join('') || '<div style="font-size:12px;color:#1e3040;padding:8px 0;">No high impact USD news today</div>';
}

function renderGeoNews() {
  const container = document.getElementById('geo-news-container');
  if (!container) return;

  container.innerHTML = geoNews.map(news => `
    <div class="nx-geo-item">
      <div class="nx-giw">⚡</div>
      <div>
        <div class="nx-gtxt">${news.title}</div>
        <div class="nx-gtag">${news.tags} · ${news.source}</div>
      </div>
    </div>
  `).join('') || '<div style="font-size:12px;color:#1e3040;padding:8px 0;">Loading geopolitical news...</div>';
}

// ============================================
// AI SIGNAL PAUSE DURING NEWS
// ============================================
function isNewsTime() {
  const now = new Date();
  return forexNews.some(event => {
    const eventTime = new Date(event.time);
    const diffMins  = Math.abs((eventTime - now) / 60000);
    return diffMins <= 15; // 15 mins before and after news
  });
}

// ============================================
// AUTO REFRESH
// ============================================
function startNewsEngine() {
  // Fetch immediately
  fetchForexFactoryNews();
  fetchGeopoliticalNews();

  // Refresh every 30 minutes
  setInterval(fetchForexFactoryNews,  30 * 60 * 1000);
  setInterval(fetchGeopoliticalNews,  30 * 60 * 1000);

  // Check alerts every minute
  setInterval(checkNewsAlerts, 60 * 1000);

  console.log('ZAEVORYQ AI — News Engine Started ✅');
}

// Export
window.ZaevoryqNews = {
  startNewsEngine,
  fetchForexFactoryNews,
  fetchGeopoliticalNews,
  isNewsTime,
  getForexNews: () => forexNews,
  getGeoNews:   () => geoNews,
};

// Auto start when page loads
document.addEventListener('DOMContentLoaded', startNewsEngine);
