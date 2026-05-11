// ZAEVORYQ AI — Live Market Data Engine
// Powered by TwelveData API

const APIKEY = 'c5009da702a54651936216e8756842ea';

// All assets with their format rules
const ASSETS = {
  // Forex
  'EURUSD':  { symbol: 'EUR/USD',  decimals: 4, category: 'forex' },
  'GBPUSD':  { symbol: 'GBP/USD',  decimals: 4, category: 'forex' },
  'USDJPY':  { symbol: 'USD/JPY',  decimals: 2, category: 'forex' },
  // Metals
  'XAUUSD':  { symbol: 'XAU/USD',  decimals: 0, category: 'metals' },
  'XAGUSD':  { symbol: 'XAG/USD',  decimals: 2, category: 'metals' },
  // Indices
  'NAS100':  { symbol: 'NDX',      decimals: 0, category: 'indices' },
  'SPX500':  { symbol: 'SPX',      decimals: 0, category: 'indices' },
  'USOIL':   { symbol: 'WTI/USD',  decimals: 0, category: 'indices' },
  // Crypto
  'BTCUSD':  { symbol: 'BTC/USD',  decimals: 0, category: 'crypto' },
};

// Timeframe mapping
const TIMEFRAMES = {
  'M1':  '1min',
  'M5':  '5min',
  'M15': '15min',
  'H1':  '1h',
  'H4':  '4h',
  'D1':  '1day',
  'W1':  '1week',
};

// Format price based on asset rules
function formatPrice(price, asset) {
  const decimals = ASSETS[asset]?.decimals ?? 2;
  return decimals === 0 
    ? Math.round(price) 
    : parseFloat(price).toFixed(decimals);
}

// Fetch live price for a single asset
async function getLivePrice(asset) {
  const info = ASSETS[asset];
  if (!info) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=${info.symbol}&apikey=${APIKEY}`
    );
    const data = await res.json();
    if (data.price) {
      return formatPrice(data.price, asset);
    }
    return null;
  } catch (err) {
    console.error(`Price fetch error for ${asset}:`, err);
    return null;
  }
}

// Fetch candlestick data for AI analysis
async function getCandleData(asset, timeframe = 'H4', count = 100) {
  const info = ASSETS[asset];
  const tf = TIMEFRAMES[timeframe];
  if (!info || !tf) return null;
  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${info.symbol}&interval=${tf}&outputsize=${count}&apikey=${APIKEY}`
    );
    const data = await res.json();
    if (data.values) {
      return data.values.map(candle => ({
        time:  candle.datetime,
        open:  parseFloat(candle.open),
        high:  parseFloat(candle.high),
        low:   parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0),
      }));
    }
    return null;
  } catch (err) {
    console.error(`Candle fetch error for ${asset} ${timeframe}:`, err);
    return null;
  }
}

// Fetch all timeframes for AI analysis
async function getAllTimeframes(asset) {
  const timeframes = ['M1','M5','M15','H1','H4','D1','W1'];
  const results = {};
  for (const tf of timeframes) {
    results[tf] = await getCandleData(asset, tf, 100);
  }
  return results;
}

// Fetch all live prices at once
async function getAllPrices() {
  const prices = {};
  for (const asset of Object.keys(ASSETS)) {
    prices[asset] = await getLivePrice(asset);
  }
  return prices;
}

// Export functions
window.ZaevoryqData = {
  getLivePrice,
  getCandleData,
  getAllTimeframes,
  getAllPrices,
  formatPrice,
  ASSETS,
  TIMEFRAMES,
};

console.log('ZAEVORYQ AI — Market Data Engine Loaded ✅');
