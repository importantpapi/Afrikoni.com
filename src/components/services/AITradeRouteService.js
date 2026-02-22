import { callChatAsJson } from '@/ai/aiClient';

// AI Trade Route Service - backed by secured Edge Function AI proxy

export const AITradeRouteService = {
  calculateOptimalRoute: async (shipmentData) => {
    const unavailable = {
      available: false,
      reason: 'AI route intelligence is currently not available.',
      routes: [],
      recommendations: []
    };

    try {
      const system = `You are a trade logistics planner for African B2B corridors.
Return JSON:
{
  "routes": [{"route":"string","estimatedDays":"number","cost":"number","method":"string","reliability":"number(0-1)"}],
  "recommendations": ["string", "string", "string"]
}
Rules:
- No markdown.
- Max 3 routes.
- Use realistic language for cross-border trade operations.`;

      const user = `Generate route options for this shipment:
origin: ${shipmentData.origin || ''}
destination: ${shipmentData.destination || ''}
weightKg: ${shipmentData.weightKg || ''}
volumeM3: ${shipmentData.volumeM3 || ''}
goodsType: ${shipmentData.goodsType || ''}
budget: ${shipmentData.budget || ''}`;

      const { success, data } = await callChatAsJson(
        { system, user, temperature: 0.2 },
        { fallback: null }
      );

      if (!success || !data) {
        return unavailable;
      }

      const routes = Array.isArray(data.routes) && data.routes.length > 0
        ? data.routes.slice(0, 3).map((route) => ({
          route: route.route || `${shipmentData.origin || 'Origin'} -> ${shipmentData.destination || 'Destination'}`,
          estimatedDays: Number(route.estimatedDays) || 0,
          cost: Number(route.cost) || 0,
          method: route.method || 'Unspecified',
          reliability: Math.max(0, Math.min(1, Number(route.reliability) || 0))
        }))
        : [];

      if (routes.length === 0) return unavailable;

      return {
        available: true,
        routes,
        recommendations: Array.isArray(data.recommendations) && data.recommendations.length > 0
          ? data.recommendations.slice(0, 3)
          : []
      };
    } catch (error) {
      return unavailable;
    }
  }
};
