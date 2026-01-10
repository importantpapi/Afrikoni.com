import React from 'react';
import WorkspaceDashboard from './WorkspaceDashboard';

/**
 * Dashboard Router - PHASE 5B: Capability-Based Single Workspace
 * 
 * PHASE 5B: Simplified - all guards moved to RequireCapability route guard
 * CapabilityProvider is now provided at route level (App.jsx)
 * 
 * This component just renders WorkspaceDashboard - guards are handled by RequireCapability
 */
export default function Dashboard() {
  // PHASE 5B: No guards here - RequireCapability route guard handles all checks
  // CapabilityProvider is provided at route level (App.jsx)
  return <WorkspaceDashboard />;
}
