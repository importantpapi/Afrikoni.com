/**
 * Legacy RFQ Creation Page - Redirect to Centralized Dashboard Flow
 * 
 * This page has been deprecated in favor of the centralized RFQ creation
 * flow at /dashboard/rfqs/new which uses the Kernel Architecture.
 * 
 * All RFQ creation logic has been moved to:
 * - Service Layer: src/services/rfqService.js
 * - UI Component: src/pages/dashboard/rfqs/new.jsx
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateRFQ() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ KERNEL ALIGNMENT: Redirect to centralized dashboard RFQ creation
    navigate('/dashboard/rfqs/new', { replace: true });
  }, [navigate]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
      <div className="text-center">
        <p className="text-afrikoni-deep">Redirecting to RFQ creation...</p>
      </div>
    </div>
  );
}
