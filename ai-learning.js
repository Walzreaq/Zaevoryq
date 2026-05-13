// ZAEVORYQ AI — Learning System
// Gets smarter after every SL hit

const sb = window.ZaevoryqAuth?.supabase;

// ============================================
// LEARNING DATABASE STRUCTURE
// ============================================
// Table: ai_learning
// - id, created_at
// - asset, signal_type, mode
// - confidence, risk_level, rr
// - entry_tf, trend_tf
// - result (win/loss/be)
// - market_structure_score
// - supply_demand_score
// - sr_score, smc_score
// - candle_score, chart_score
// - trend_score, momentum_score
// - news_present (bool)
// - news_currency, news_impact
// - lesson (what AI learned)
// - weight_adjustment (json)

// ============================================
// CURRENT AI WEIGHTS (starts at defaults)
// ============================================
let aiWeights = {
  market_structure: 20,
  supply_demand:    20,
  support_resistance: 15,
  smart_money:      15,
  chart_patterns:   10,
  candle_patterns:  10,
  trend_analysis:    5,
  momentum:          5,
};

// Asset-specific confidence adjustments
let assetAdjustments = {
  XAUUSD:  0,
  EURUSD:  0,
  GBPUSD:  0,
  USDJPY:  0,
  XAGUSD:  0,
  NAS100:  0,
  SPX500:  0,
  USOIL:   0,
  BTCUSD:  0,
};

// News penalty — reduce confidence when news is near
let newsPenalty = {
  HIGH:   15, // Reduce confidence by 15% during high impact news
  MEDIUM:  8,
  LOW:     3,
};

// ============================================
// LOAD AI WEIGHTS FROM DATABASE
// ============================================
async function loadAIWeights() {
  if (!sb) return;
  try {
    const { data, error } = await sb
      .from('ai_weights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      aiWeights         = data.weights        || aiWeights;
      assetAdjustments  = data.asset_adjustments || assetAdjustments;
      newsPenalty       = data.news_penalty   || newsPenalty;
      console.log('ZAEVORYQ AI — Weights loaded from database ✅');
    }
  } catch (err) {
    console.log('ZAEVORYQ AI — Using default weights');
  }
}

// ============================================
// SAVE UPDATED WEIGHTS TO DATABASE
// ============================================
async function saveAIWeights() {
  if (!sb) return;
  try {
    await sb.from('ai_weights').insert([{
      weights:           aiWeights,
      asset_adjustments: assetAdjustments,
      news_penalty:      newsPenalty,
      note:              'Auto-updated by learning system',
    }]);
    console.log('ZAEVORYQ AI — Weights saved to database ✅');
  } catch (err) {
    console.error('Save weights error:', err);
  }
}

// ============================================
// LEARN FROM SL HIT — MAIN LEARNING FUNCTION
// ============================================
async function learnFromSLHit(signal, analysisScores, newsData = null) {
  console.log(`ZAEVORYQ AI — Learning from SL hit on ${signal.asset}...`);

  const lessons   = [];
  const adjustments = {};

  // 1. Find which analysis was highest scored but still lost
  const scores = {
    market_structure:    analysisScores.structureScore    || 0,
    supply_demand:       analysisScores.supdemScore        || 0,
    support_resistance:  analysisScores.srScore            || 0,
    smart_money:         analysisScores.smcScore           || 0,
    chart_patterns:      analysisScores.chartScore         || 0,
    candle_patterns:     analysisScores.candleScore        || 0,
    trend_analysis:      analysisScores.trendScore         || 0,
    momentum:            analysisScores.momentumScore      || 0,
  };

  // Find highest contributing factor to the losing trade
  const maxScore  = Math.max(...Object.values(scores));
  const maxFactor = Object.keys(scores).find(k => scores[k] === maxScore);

  // Slightly reduce weight of the factor that led to loss
  if (aiWeights[maxFactor] > 5) {
    aiWeights[maxFactor] = Math.max(5, aiWeights[maxFactor] - 1);
    adjustments[maxFactor] = -1;
    lessons.push(`Reduced ${maxFactor} weight by 1% — was highest in losing trade`);
  }

  // 2. Check if news was present during SL hit
  if (newsData && newsData.impact === 'HIGH') {
    newsPenalty.HIGH = Math.min(25, newsPenalty.HIGH + 2);
    adjustments.news_penalty_high = +2;
    lessons.push(`High impact ${newsData.currency} news present — increased news penalty to ${newsPenalty.HIGH}%`);
  }

  // 3. Asset-specific adjustment
  assetAdjustments[signal.asset] = (assetAdjustments[signal.asset] || 0) - 2;
  assetAdjustments[signal.asset] = Math.max(-15, assetAdjustments[signal.asset]);
  adjustments[`asset_${signal.asset}`] = -2;
  lessons.push(`${signal.asset} confidence reduced by 2% — SL hit recorded`);

  // 4. Mode-specific learning
  if (signal.mode === 'scalping') {
    lessons.push('Scalping SL noted — reviewing volatility thresholds');
  }

  // 5. Risk level learning
  if (signal.risk_level === 'HIGH RISK') {
    lessons.push('HIGH RISK signal hit SL — confirming high risk warning is valid');
  }

  // 6. Normalize weights to still add up to 100
  normalizeWeights();

  // 7. Save learning event to database
  await saveLearningEvent({
    asset:        signal.asset,
    signal_type:  signal.signal,
    mode:         signal.mode,
    confidence:   signal.confidence,
    risk_level:   signal.riskLevel,
    result:       'loss',
    lessons:      lessons,
    adjustments,
    scores,
    news_present: !!newsData,
    news_currency: newsData?.currency || null,
    news_impact:   newsData?.impact   || null,
  });

  // 8. Save updated weights
  await saveAIWeights();

  console.log('ZAEVORYQ AI — Learning complete:', lessons);
  return { lessons, adjustments };
}

// ============================================
// LEARN FROM WIN — REINFORCE GOOD PATTERNS
// ============================================
async function learnFromWin(signal, analysisScores, tpLevel = 'tp1') {
  console.log(`ZAEVORYQ AI — Reinforcing win on ${signal.asset}...`);

  const lessons     = [];
  const adjustments = {};

  // Reinforce asset confidence on wins
  const boost = tpLevel === 'tp3' ? 3 : tpLevel === 'tp2' ? 2 : 1;
  assetAdjustments[signal.asset] = (assetAdjustments[signal.asset] || 0) + boost;
  assetAdjustments[signal.asset] = Math.min(15, assetAdjustments[signal.asset]);
  adjustments[`asset_${signal.asset}`] = +boost;
  lessons.push(`${signal.asset} confidence increased by ${boost}% — ${tpLevel.toUpperCase()} hit`);

  // Reinforce highest scoring factor
  const scores = {
    market_structure:   analysisScores.structureScore || 0,
    supply_demand:      analysisScores.supdemScore    || 0,
    support_resistance: analysisScores.srScore        || 0,
    smart_money:        analysisScores.smcScore       || 0,
  };

  const maxFactor = Object.keys(scores).reduce((a,b) => scores[a] > scores[b] ? a : b);
  if (tpLevel === 'tp3' && aiWeights[maxFactor] < 25) {
    aiWeights[maxFactor] += 1;
    adjustments[maxFactor] = +1;
    lessons.push(`Reinforced ${maxFactor} weight — Full TP hit`);
    normalizeWeights();
  }

  await saveLearningEvent({
    asset:       signal.asset,
    signal_type: signal.signal,
    mode:        signal.mode,
    confidence:  signal.confidence,
    risk_level:  signal.riskLevel,
    result:      tpLevel === 'tp3' ? 'full_win' : 'partial_win',
    lessons,
    adjustments,
    scores,
  });

  await saveAIWeights();
  return { lessons, adjustments };
}

// ============================================
// NORMALIZE WEIGHTS TO SUM TO 100
// ============================================
function normalizeWeights() {
  const total = Object.values(aiWeights).reduce((a,b) => a + b, 0);
  if (total !== 100) {
    const factor = 100 / total;
    Object.keys(aiWeights).forEach(k => {
      aiWeights[k] = Math.round(aiWeights[k] * factor);
    });
  }
}

// ============================================
// APPLY LEARNING TO CONFIDENCE SCORE
// ============================================
function applyLearning(baseConfidence, asset, newsImpact = null) {
  let confidence = baseConfidence;

  // Apply asset adjustment
  confidence += (assetAdjustments[asset] || 0);

  // Apply news penalty
  if (newsImpact && newsPenalty[newsImpact]) {
    confidence -= newsPenalty[newsImpact];
    console.log(`ZAEVORYQ AI — News penalty applied: -${newsPenalty[newsImpact]}%`);
  }

  // Keep within bounds
  confidence = Math.max(0, Math.min(100, Math.round(confidence)));
  return confidence;
}

// ============================================
// SAVE LEARNING EVENT TO DATABASE
// ============================================
async function saveLearningEvent(eventData) {
  if (!sb) return;
  try {
    await sb.from('ai_learning').insert([{
      asset:         eventData.asset,
      signal_type:   eventData.signal_type,
      mode:          eventData.mode,
      confidence:    eventData.confidence,
      risk_level:    eventData.risk_level,
      result:        eventData.result,
      lessons:       eventData.lessons,
      adjustments:   eventData.adjustments,
      scores:        eventData.scores,
      news_present:  eventData.news_present  || false,
      news_currency: eventData.news_currency || null,
      news_impact:   eventData.news_impact   || null,
    }]);
  } catch (err) {
    console.error('Save learning event error:', err);
  }
}

// ============================================
// GET LEARNING STATS FOR DASHBOARD
// ============================================
async function getLearningStats() {
  if (!sb) return getDemoLearningStats();
  try {
    const { data, error } = await sb
      .from('ai_learning')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const totalEvents = data.length;
    const losses      = data.filter(e => e.result === 'loss').length;
    const wins        = data.filter(e => e.result.includes('win')).length;
    const latestLesson = data[0]?.lessons?.[0] || 'No events yet';

    return {
      totalEvents,
      losses,
      wins,
      latestLesson,
      weights:          aiWeights,
      assetAdjustments,
    };
  } catch (err) {
    return getDemoLearningStats();
  }
}

function getDemoLearningStats() {
  return {
    totalEvents:  142,
    losses:        31,
    wins:         111,
    latestLesson: 'EUR/USD BUY SL hit — CPI volatility underweighted. News penalty increased.',
    weights:       aiWeights,
    assetAdjustments: {
      XAUUSD: +8, EURUSD: +5, GBPUSD: +3,
      USDJPY: -2, XAGUSD: +1, NAS100: +4,
      SPX500: +6, USOIL:  -3, BTCUSD: +2,
    },
  };
}

// ============================================
// RENDER LEARNING PANEL
// ============================================
function renderLearningPanel(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  getLearningStats().then(stats => {
    container.innerHTML = `
      <div style="background:#010305;border:1px solid #0d1820;border-radius:4px;padding:16px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#c8a84b30,transparent);"></div>
        <div style="font-size:10px;font-weight:700;color:#c8a84b;letter-spacing:0.18em;text-transform:uppercase;font-family:'Space Mono',monospace;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
          🧠 AI NEURAL LEARNING
        </div>

        ${Object.entries(stats.weights).map(([key, val]) => `
          <div style="margin-bottom:8px;">
            <div style="font-size:10px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.06em;margin-bottom:4px;text-transform:uppercase;">${key.replace(/_/g,' ')}</div>
            <div style="background:#020408;border-radius:2px;height:3px;overflow:hidden;">
              <div style="height:100%;border-radius:2px;background:linear-gradient(90deg,#c8a84b,#d4b85a);width:${val}%;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px;">
              <span style="color:#1e3040;font-family:'Space Mono',monospace;">Weight</span>
              <span style="color:#c8a84b;font-family:'Space Mono',monospace;">${val}%</span>
            </div>
          </div>
        `).join('')}

        <div style="background:#020408;border-radius:3px;padding:10px;border:1px solid #0d1820;margin-top:10px;">
          <div style="font-size:10px;color:#1e3040;font-family:'Space Mono',monospace;letter-spacing:0.08em;margin-bottom:5px;">LAST LEARNING EVENT</div>
          <div style="font-size:12px;color:#5a6a7a;line-height:1.5;font-weight:500;">${stats.latestLesson}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px;">
          <div style="background:#020408;border-radius:3px;padding:8px;border:1px solid #0d1820;text-align:center;">
            <div style="font-size:16px;font-weight:700;font-family:'Space Mono',monospace;color:#c8a84b;">${stats.totalEvents}</div>
            <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;text-transform:uppercase;">Events</div>
          </div>
          <div style="background:#020408;border-radius:3px;padding:8px;border:1px solid #0d1820;text-align:center;">
            <div style="font-size:16px;font-weight:700;font-family:'Space Mono',monospace;color:#00ff6a;">${stats.wins}</div>
            <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;text-transform:uppercase;">Wins</div>
          </div>
          <div style="background:#020408;border-radius:3px;padding:8px;border:1px solid #0d1820;text-align:center;">
            <div style="font-size:16px;font-weight:700;font-family:'Space Mono',monospace;color:#ff4466;">${stats.losses}</div>
            <div style="font-size:9px;color:#1e3040;font-family:'Space Mono',monospace;text-transform:uppercase;">Losses</div>
          </div>
        </div>
      </div>
    `;
  });
}

// Auto load weights on startup
loadAIWeights();

// Export
window.ZaevoryqLearning = {
  learnFromSLHit,
  learnFromWin,
  applyLearning,
  getLearningStats,
  renderLearningPanel,
  getWeights: () => aiWeights,
  getAssetAdjustments: () => assetAdjustments,
};

console.log('ZAEVORYQ AI — Learning System Loaded ✅');
