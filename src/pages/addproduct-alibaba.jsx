/**
 * Legacy Product Creation Page - Redirect to Centralized Dashboard Flow
 * 
 * This page has been deprecated in favor of the centralized product creation
 * flow at /dashboard/products/new which uses the Kernel Architecture.
 * 
 * All product creation logic has been moved to:
 * - Service Layer: src/services/productService.js
 * - UI Component: src/pages/dashboard/products/new.jsx
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddProductAlibaba() {
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ KERNEL ALIGNMENT: Redirect to centralized dashboard product creation
    navigate('/dashboard/products/new', { replace: true });
  }, [navigate]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center">
      <div className="text-center">
        <p className="text-afrikoni-deep">Redirecting to product creation...</p>
      </div>
    </div>
  );
}
