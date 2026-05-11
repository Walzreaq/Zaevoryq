// ZAEVORYQ AI — Signal Engine
// Technical Analysis Brain

// ============================================
// MARKET STRUCTURE ANALYSIS (20%)
// ============================================
function analyzeMarketStructure(candles) {
  if (!candles || candles.length < 10) return { score: 0, direction: 'neutral', reason: '' };
  
  const highs = candles.map(c => c.high);
  const lows  = candles.map(c => c.low);
  
  // Check for Higher Highs / Higher Lows (Bullish)
  const recentHighs = highs.slice(-5);
  const recentLows  = lows.slice(-5);
  
  const hhhl = recentHighs[4] > recentHighs[2] && recentLows[4] > recentLows[2];
  const lllh = recentHighs[4] < recentHighs[2] && recentLows[4] < recentLows[2];
  
  // Break of Structure
  const prevHigh = Math.max(...highs.slice(-10, -5));
  const prevLow  = Math.min(...lows.slice(-10, -5));
  const currClose = candles[candles.length - 1].close;
  
  const bullishBOS = currClose > prevHigh;
  const bearishBOS = currClose < prevLow;
  
  if (hhhl || bullishBOS) return { score: 20, direction: 'bullish', reason: bullishBOS ? 'Bullish BOS confirmed' : 'HH/HL structure intact' };
  if (lllh || bearishBOS) return { score: 20, direction: 'bearish', reason: bearishBOS ? 'Bearish BOS confirmed' : 'LL/LH structure intact' };
  return { score: 0, direction: 'neutral', reason: 'No clear structure' };
}

// ============================================
// SUPPLY & DEMAND ZONES (20%)
// ============================================
function analyzeSupplyDemand(candles) {
  if (!candles || candles.length < 20) return { score: 0, direction: 'neutral', reason: '' };
  
  const currPrice = candles[candles.length - 1].close;
  let demandZones = [];
  let supplyZones = [];
  
  // Find demand zones (strong bullish moves)
  for (let i = 5; i < candles.length - 5; i++) {
    const move = candles[i+1].close - candles[i].open;
    const zoneSize = candles[i].high - candles[i].low;
    if (move > zoneSize * 2) {
      demandZones.push({ top: candles[i].high, bottom: candles[i].low });
    }
  }

  // Find supply zones (strong bearish moves)
  for (let i = 5; i < candles.length - 5; i++) {
    const move = candles[i].open - candles[i+1].close;
    const zoneSize = candles[i].high - candles[i].low;
    if (move > zoneSize * 2) {
      supplyZones.push({ top: candles[i].high, bottom: candles[i].low });
    }
  }

  // Check if price is in a zone
  const inDemand = demandZones.some(z => currPrice >= z.bottom && currPrice <= z.top);
  const inSupply = supplyZones.some(z => currPrice >= z.bottom && currPrice <= z.top);

  if (inDemand) return { score: 20, direction: 'bullish', reason: 'Price in fresh demand zone' };
  if (inSupply) return { score: 20, direction: 'bearish', reason: 'Price in fresh supply zone' };
  return { score: 0, direction: 'neutral', reason: 'No zone confluence' };
}

// ============================================
// SUPPORT & RESISTANCE (15%)
// ============================================
function analyzeSupportResistance(candles) {
  if (!candles || candles.length < 20) return { score: 0, direction: 'neutral', reason: '' };
  
  const currPrice = candles[candles.length - 1].close;
  const highs = candles.map(c => c.high);
  const lows  = candles.map(c => c.low);
  
  // Find key levels
  const resistance = Math.max(...highs.slice(-20));
  const support    = Math.min(...lows.slice(-20));
  const range      = resistance - support;
  
  // Check proximity to support or resistance (within 2% of range)
  const nearSupport    = Math.abs(currPrice - support) < range * 0.02;
  const nearResistance = Math.abs(currPrice - resistance) < range * 0.02;
  
  if (nearSupport)    return { score: 15, direction: 'bullish', reason: 'Price at key support level' };
  if (nearResistance) return { score: 15, direction: 'bearish', reason: 'Price at key resistance level' };
  return { score: 0, direction: 'neutral', reason: 'No SR confluence' };
}

// ============================================
// SMART MONEY CONCEPTS (15%)
// ============================================
function analyzeSmartMoney(candles) {
  if (!candles || candles.length < 10) return { score: 0, direction: 'neutral', reason: '' };
  
  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  // Fair Value Gap (FVG) detection
  const bullFVG = prev2.high < curr.low;  // Gap up
  const bearFVG = prev2.low  > curr.high; // Gap down

  // Order Block detection
  const bullOB = prev.close < prev.open && curr.close > prev.high;
  const bearOB = prev.close > prev.open && curr.close < prev.low;

  if (bullFVG || bullOB) return { score: 15, direction: 'bullish', reason: bullFVG ? 'Bullish FVG detected' : 'Bullish order block' };
  if (bearFVG || bearOB) return { score: 15, direction: 'bearish', reason: bearFVG ? 'Bearish FVG detected' : 'Bearish order block' };
  return { score: 0, direction: 'neutral', reason: 'No SMC confluence' };
}

// ============================================
// CANDLESTICK PATTERNS (10%)
// ============================================
function analyzeCandlePatterns(candles) {
  if (!candles || candles.length < 3) return { score: 0, direction: 'neutral', reason: '' };
  
  const c  = candles[candles.length - 1];
  const p  = candles[candles.length - 2];
  const p2 = candles[candles.length - 3];
  
  const body     = Math.abs(c.close - c.open);
  const topWick  = c.high - Math.max(c.close, c.open);
  const botWick  = Math.min(c.close, c.open) - c.low;
  
  // Bullish Pin Bar
  if (botWick > body * 2 && c.close > c.open) return { score: 10, direction: 'bullish', reason: 'Bullish pin bar / hammer' };
  // Bearish Pin Bar
  if (topWick > body * 2 && c.close < c.open) return { score: 10, direction: 'bearish', reason: 'Bearish pin bar / shooting star' };
  // Bullish Engulfing
  if (p.close < p.open && c.close > c.open && c.close > p.open && c.open < p.close) return { score: 10, direction: 'bullish', reason: 'Bullish engulfing candle' };
  // Bearish Engulfing
  if (p.close > p.open && c.close < c.open && c.close < p.open && c.open > p.close) return { score: 10, direction: 'bearish', reason: 'Bearish engulfing candle' };
  
  return { score: 0, direction: 'neutral', reason: 'No pattern confluence' };
}

// ============================================
// TREND ANALYSIS (5%)
// ============================================
function analyzeTrend(candles) {
  if (!candles || candles.length < 20) return { score: 0, direction: 'neutral', reason: '' };
  
  const closes = candles.map(c => c.close);
  
  // Simple Moving Average
  const sma20 = closes.slice(-20).reduce((a,b) => a+b, 0) / 20;
  const sma50 = closes.length >= 50 ? closes.slice(-50).reduce((a,b) => a+b, 0) / 50 : sma20;
  const curr  = closes[closes.length - 1];
  
  if (curr > sma20 && sma20 > sma50) return { score: 5, direction: 'bullish', reason: 'Price above MA — uptrend confirmed' };
  if (curr < sma20 && sma20 < sma50) return { score: 5, direction: 'bearish', reason: 'Price below MA — downtrend confirmed' };
  return { score: 0, direction: 'neutral', reason: 'Ranging market' };
}

// ============================================
// MOMENTUM — RSI & MACD (5%)
// ============================================
function analyzeMomentum(candles) {
  if (!candles || candles.length < 14) return { score: 0, direction: 'neutral', reason: '' };
  
  const closes = candles.map(c => c.close);
  
  // RSI Calculation
  let gains = 0, losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    if (diff > 0) gains  += diff;
    else          losses -= diff;
  }
  const rs  = gains / (losses || 1);
  const rsi = 100 - (100 / (1 + rs));
  
  if (rsi < 35) return { score: 5, direction: 'bullish', reason: `RSI oversold (${Math.round(rsi)}) — bullish momentum` };
  if (rsi > 65) return { score: 5, direction: 'bearish', reason: `RSI overbought (${Math.round(rsi)}) — bearish momentum` };
  return { score: 0, direction: 'neutral', reason: `RSI neutral (${Math.round(rsi)})` };
}

// ============================================
// CHART PATTERNS (10%)
// ============================================
function analyzeChartPatterns(candles) {
  if (!candles || candles.length < 20) return { score: 0, direction: 'neutral', reason: '' };

  const highs  = candles.map(c => c.high);
  const lows   = candles.map(c => c.low);
  const recent = candles.slice(-20);

  // Double Bottom
  const recentLows = lows.slice(-20);
  const minLow     = Math.min(...recentLows);
  const lowCount   = recentLows.filter(l => Math.abs(l - minLow) < minLow * 0.005).length;
  if (lowCount >= 2) return { score: 10, direction: 'bullish', reason: 'Double bottom pattern detected' };

  // Double Top
  const recentHighs = highs.slice(-20);
  const maxHigh     = Math.max(...recentHighs);
  const highCount   = recentHighs.filter(h => Math.abs(h - maxHigh) < maxHigh * 0.005).length;
  if (highCount >= 2) return { score: 10, direction: 'bearish', reason: 'Double top pattern detected' };

  return { score: 0, direction: 'neutral', reason: 'No chart pattern' };
}

// ============================================
// MAIN SIGNAL GENERATOR
// ============================================
function generateSignal(asset, allTimeframeData, mode = 'swing') {

  // Pick primary timeframes based on mode
  const primaryTF   = mode === 'scalping' ? 'M15' : mode === 'intraday' ? 'H1'  : 'H4';
  const confirmTF   = mode === 'scalping' ? 'H1'  : mode === 'intraday' ? 'H4'  : 'D1';
  const trendTF     = mode === 'scalping' ? 'H4'  : mode === 'intraday' ? 'D1'  : 'W1';

  const primaryCandles = allTimeframeData[primaryTF];
  const confirmCandles = allTimeframeData[confirmTF];
  const trendCandles   = allTimeframeData[trendTF];

  if (!primaryCandles || !confirmCandles) {
    return { signal: null, reason: 'Insufficient data' };
  }

  // Run all analyses on primary timeframe
  const structure = analyzeMarketStructure(primaryCandles);
  const supdem    = analyzeSupplyDemand(primaryCandles);
  const sr        = analyzeSupportResistance(primaryCandles);
  const smc       = analyzeSmartMoney(primaryCandles);
  const candle    = analyzeCandlePatterns(primaryCandles);
  const chart     = analyzeChartPatterns(primaryCandles);
  const trend     = analyzeTrend(trendCandles || primaryCandles);
  const momentum  = analyzeMomentum(primaryCandles);

  const analyses  = [structure, supdem, sr, smc, candle, chart, trend, momentum];

  // Count directional votes
  const bullScore = analyses.filter(a => a.direction === 'bullish').reduce((s,a) => s + a.score, 0);
  const bearScore = analyses.filter(a => a.direction === 'bearish').reduce((s,a) => s + a.score, 0);
  const totalScore = Math.max(bullScore, bearScore);
  const direction  = bullScore >= bearScore ? 'bullish' : 'bearish';

  // Confidence = total score as percentage
  const confidence = Math.min(Math.round(totalScore), 100);

  // No signal below 70%
  if (confidence < 70) {
    return { signal: null, confidence, reason: 'Confluence too low — no signal' };
  }

  // Determine risk level
  let riskLevel, rr;
  if      (confidence >= 95) { riskLevel = 'ELITE';       rr = '1:3'; }
  else if (confidence >= 88) { riskLevel = 'LOW RISK';    rr = '1:3'; }
  else if (confidence >= 80) { riskLevel = 'MEDIUM RISK'; rr = '1:2.5'; }
  else                       { riskLevel = 'HIGH RISK';   rr = '1:2'; }

  // Signal type
  const currPrice  = primaryCandles[primaryCandles.length - 1].close;
  const signalType = direction === 'bullish' ? 'BUY' : 'SELL';

  // Calculate entry, SL, TP based on asset and mode
  const assetInfo  = window.ZaevoryqData?.ASSETS[asset] || { decimals: 4 };
  const pipSize    = assetInfo.decimals === 0 ? 1 : Math.pow(10, -assetInfo.decimals);

  // Mode pip rules
  const pipRules = {
    scalping: { sl: 15,  tp1: 15,  tp2: 30,  tp3: 45  },
    intraday: { sl: 50,  tp1: 50,  tp2: 100, tp3: 150 },
    swing:    { sl: 100, tp1: 100, tp2: 200, tp3: 300 },
  };
  const rules = pipRules[mode] || pipRules.swing;

  const slPips  = rules.sl  * pipSize;
  const tp1Pips = rules.tp1 * pipSize;
  const tp2Pips = rules.tp2 * pipSize;
  const tp3Pips = rules.tp3 * pipSize;

  const fmt = (n) => {
    if (assetInfo.decimals === 0) return Math.round(n);
    return parseFloat(n.toFixed(assetInfo.decimals));
  };

  let entry, sl, tp1, tp2, tp3;
  if (direction === 'bullish') {
    entry = fmt(currPrice);
    sl    = fmt(currPrice - slPips);
    tp1   = fmt(currPrice + tp1Pips);
    tp2   = fmt(currPrice + tp2Pips);
    tp3   = fmt(currPrice + tp3Pips);
  } else {
    entry = fmt(currPrice);
    sl    = fmt(currPrice + slPips);
    tp1   = fmt(currPrice - tp1Pips);
    tp2   = fmt(currPrice - tp2Pips);
    tp3   = fmt(currPrice - tp3Pips);
  }

  // Collect AI reasons
  const reasons = analyses
    .filter(a => a.direction === direction && a.reason)
    .map(a => a.reason)
    .slice(0, 3);

  return {
    signal:     signalType,
    asset,
    confidence,
    riskLevel,
    rr,
    entry,
    sl,
    tp1,
    tp2,
    tp3:        riskLevel === 'HIGH RISK' ? null : tp3,
    be:         null,
    status:     'Active',
    mode,
    entryTF:    primaryTF,
    trendTF,
    reasons,
    timestamp:  new Date().toISOString(),
  };
}

// Export
window.ZaevoryqSignal = {
  generateSignal,
  analyzeMarketStructure,
  analyzeSupplyDemand,
  analyzeSupportResistance,
  analyzeSmartMoney,
  analyzeCandlePatterns,
  analyzeChartPatterns,
  analyzeTrend,
  analyzeMomentum,
};

console.log('ZAEVORYQ AI — Signal Engine Loaded ✅');
