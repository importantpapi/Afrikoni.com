import type { UserRole } from '@/context/RoleContext';

export const featureMatrix: Record<UserRole, string[]> = {
  buyer: ['rfqs', 'orders', 'messages'],
  seller: ['products', 'orders', 'analytics', 'messages'],
  hybrid: ['rfqs', 'products', 'orders', 'analytics', 'messages'],
  logistics: ['shipments', 'quotes', 'tracking', 'messages'],
};

export function roleHasFeature(role: UserRole | null, feature: string): boolean {
  if (!role) return false;
  return featureMatrix[role]?.includes(feature) ?? false;
}








