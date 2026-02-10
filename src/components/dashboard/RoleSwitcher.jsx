import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';

/**
 * Role Switcher for Hybrid Users
 * Allows switching between buyer and seller dashboards
 */
export function RoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect current mode from URL
  // Hybrid users can be on /dashboard/hybrid, /dashboard/buyer, or /dashboard/seller
  const currentMode = location.pathname.includes('/seller') 
    ? 'seller' 
    : location.pathname.includes('/buyer') 
    ? 'buyer' 
    : 'buyer'; // Default to buyer if on /dashboard/hybrid
  
  const switchMode = (mode) => {
    if (mode === currentMode) return;
    
    // Navigate to the other dashboard
    if (mode === 'seller') {
      navigate('/dashboard/seller');
    } else {
      navigate('/dashboard/buyer');
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg p-1 border">
      <button
        onClick={() => switchMode('buyer')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentMode === 'buyer'
            ? 'bg-afrikoni-gold text-afrikoni-charcoal shadow-sm'
            : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark hover:bg-afrikoni-gold/10'
        }`}
      >
        <ShoppingBag size={18} />
        Buying
      </button>
      
      <button
        onClick={() => switchMode('seller')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentMode === 'seller'
            ? 'bg-afrikoni-gold text-afrikoni-charcoal shadow-sm'
            : 'text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark hover:bg-afrikoni-gold/10'
        }`}
      >
        <Store size={18} />
        Selling
      </button>
    </div>
  );
}

