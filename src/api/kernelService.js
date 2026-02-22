import { supabase } from "@/api/supabaseClient";

async function getProfileCompanyId() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle?.() ?? { data: null };
    return data?.company_id ?? null;
  } catch {
    return null;
  }
}

export async function fetchKernelState() {
  const companyId = await getProfileCompanyId();

  let tradeQuery = supabase
    .from('trades')
    .select('id, status, origin_country, destination_country, target_price, price_min, price_max, buyer_company_id, seller_company_id')
    .order('created_at', { ascending: false });

  if (companyId) {
    tradeQuery = tradeQuery.or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`);
  }

  const { data: trades } = await tradeQuery;
  const tradeList = trades || [];

  const activeTrades = tradeList.length;
  const capitalInMotion = tradeList.reduce((sum, trade) => {
    const value = trade.target_price ?? trade.price_max ?? trade.price_min ?? 0;
    return sum + Number(value || 0);
  }, 0);
  const activeCorridors = new Set(
    tradeList.map((trade) => `${trade.origin_country || 'NA'}-${trade.destination_country || 'NA'}`)
  ).size;

  let complianceReady = 60;
  let riskSurface = 'moderate';

  if (companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('afcfta_ready, trust_score')
      .eq('id', companyId)
      .maybeSingle?.() ?? { data: null };
    complianceReady = company?.afcfta_ready ? 90 : 65;
    const trustScore = Number(company?.trust_score ?? 60);
    if (trustScore < 45) riskSurface = 'high';
    else if (trustScore < 70) riskSurface = 'moderate';
    else riskSurface = 'low';
  }

  return {
    activeCorridors,
    capitalInMotion,
    activeTrades,
    complianceReadiness: complianceReady,
    riskSurface,
    timestamp: Date.now(),
  };
}

export async function fetchTradeHealth(tradeId) {
  const { data: trade } = await supabase
    .from('trades')
    .select('id, status, origin_country, destination_country, target_price, price_min, price_max')
    .eq('id', tradeId)
    .maybeSingle?.() ?? { data: null };

  if (!trade) return { status: "BLOCKED", score: 0, reasons: ["Trade not found"] };

  const { data: escrow } = await supabase
    .from('escrows')
    .select('amount, balance, status')
    .eq('trade_id', tradeId)
    .maybeSingle?.() ?? { data: null };

  const escrowTotal = Number(escrow?.amount || 0);
  const escrowBalance = Number(escrow?.balance ?? escrowTotal);
  const escrowPct = escrowTotal > 0 ? Math.round(((escrowTotal - escrowBalance) / escrowTotal) * 100) : 0;

  const { data: complianceCase } = await supabase
    .from('compliance_cases')
    .select('state')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle?.() ?? { data: null };

  const compliance = complianceCase?.state === 'approved' ? 92 : complianceCase ? 65 : 55;
  const trust = trade.destination_country && trade.origin_country ? 70 : 60;
  const score = Math.round((escrowPct * 0.4) + (compliance * 0.35) + (trust * 0.25));
  let status = "HEALTHY";
  if (score < 40) status = "BLOCKED";
  else if (score < 70) status = "AT_RISK";
  const blockers = [];
  if (escrowPct < 50) blockers.push("Escrow below 50%");
  if (compliance < 70) blockers.push("Compliance readiness low");
  if (trust < 60) blockers.push("Counterparty risk high");
  return { status, score, escrowPct, compliance, trust, blockers };
}

export async function fetchCorridors() {
  const companyId = await getProfileCompanyId();
  let tradeQuery = supabase
    .from('trades')
    .select('id, origin_country, destination_country, target_price, price_min, price_max, metadata, buyer_company_id, seller_company_id');

  if (companyId) {
    tradeQuery = tradeQuery.or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`);
  }

  const { data: trades } = await tradeQuery;
  const corridors = {};

  (trades || []).forEach((trade) => {
    const origin = trade.origin_country || 'NA';
    const destination = trade.destination_country || 'NA';
    const key = `${origin}-${destination}`;
    if (!corridors[key]) {
      corridors[key] = {
        id: key,
        origin,
        destination,
        trades: 0,
        totalValue: 0,
        risk: trade?.metadata?.risk_level || 'medium',
        delayRisk: 15,
        congestion: 18,
        complianceRate: 70,
      };
    }
    corridors[key].trades += 1;
    const value = trade.target_price ?? trade.price_max ?? trade.price_min ?? 0;
    corridors[key].totalValue += Number(value || 0);
  });

  return Object.values(corridors);
}

export async function fetchCapitalState() {
  const companyId = await getProfileCompanyId();
  let escrowQuery = supabase
    .from('escrows')
    .select('amount, balance, status, buyer_company_id, seller_company_id');
  if (companyId) {
    escrowQuery = escrowQuery.or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`);
  }
  const { data: escrows } = await escrowQuery;
  const totalCapitalLocked = (escrows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const capitalHeld = (escrows || []).reduce((sum, row) => {
    const balance = row.balance ?? row.amount ?? 0;
    return sum + Number(balance || 0);
  }, 0);

  let paymentsQuery = supabase
    .from('payments')
    .select('amount, status, payment_type, recipient_id');
  if (companyId) {
    paymentsQuery = paymentsQuery.eq('recipient_id', companyId);
  }
  const { data: payments } = await paymentsQuery;
  const capitalReleased = (payments || [])
    .filter((p) => p.payment_type === 'escrow_release' && p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const capitalAtRisk = Math.max(0, capitalHeld * 0.12);
  const blockers = [
    capitalHeld > 0 ? "Awaiting milestone confirmation" : null,
    capitalAtRisk > 0 ? "Open disputes in corridor" : null,
  ].filter(Boolean);
  return { totalCapitalLocked, capitalReleased, capitalHeld, capitalAtRisk, blockers };
}

export async function fetchCompliance() {
  const companyId = await getProfileCompanyId();
  let score = 65;
  let afcftaEligible = false;
  if (companyId) {
    const { data: company } = await supabase
      .from('companies')
      .select('afcfta_ready')
      .eq('id', companyId)
      .maybeSingle?.() ?? { data: null };
    afcftaEligible = Boolean(company?.afcfta_ready);
    score = afcftaEligible ? 88 : 60;
  }
  const rulesOfOrigin = afcftaEligible ? "Meets RoO for eligible corridors" : "Documents missing";
  const readiness = score;
  return { score, readiness, afcftaEligible, rulesOfOrigin };
}

export async function fetchTradeCopilot() {
  try {
    const { data: trades } = await supabase
      .from('trades')
      .select('id, status, product_name, origin_country, destination_country')
      .not('status', 'in', '("closed","settled")')
      .limit(5);

    const actions = [];

    // 1. Analyze Trades
    if (trades && trades.length > 0) {
      trades.forEach(trade => {
        if (trade.status === 'draft' || trade.status === 'rfq_open') {
          actions.push({
            id: `act-${trade.id}-submit`,
            title: `Submit RFQ for ${trade.product_name || 'Goods'}`,
            description: 'Draft RFQ is ready. Submit to network to get quotes.',
            action: `/dashboard/trades/${trade.id}`,
            priority: 'high',
            type: 'action'
          });
        }
        if (trade.status === 'escrow_pending') {
          actions.push({
            id: `act-${trade.id}-fund`,
            title: `Fund Escrow for ${trade.product_name}`,
            description: 'Seller accepted quote. Fund escrow to start production.',
            action: `/dashboard/trades/${trade.id}`,
            priority: 'high',
            type: 'finance'
          });
        }
      });
    } else {
      actions.push({
        id: 'act-new-trade',
        title: 'Start New Trade',
        description: 'No active trades. Launch a new RFQ to source products.',
        action: '/dashboard/rfqs/new',
        priority: 'medium',
        type: 'opportunity'
      });
    }

    // 2. Compliance Check (Mocked for now, or fetch company profile)
    // We could fetch company profile here to check afcfta_ready
    // For now, let's add a generic one if no trades
    if (actions.length < 3) {
      actions.push({
        id: 'act-verify',
        title: 'Complete Verification',
        description: 'Upload business registration to unlock $50k limit.',
        action: '/dashboard/settings',
        priority: 'medium',
        type: 'trust'
      });
    }

    return { actions };
  } catch (error) {
    console.error('Error fetching copilot actions:', error);
    return { actions: [] };
  }
}
