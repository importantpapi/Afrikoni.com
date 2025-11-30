import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Package, ShoppingBag, FileText, MessageCircle, BarChart3, CreditCard, Truck, Users, Settings } from 'lucide-react';

export default function DashboardSidebar({ activeRole }) {
  const location = useLocation();

  const buyerMenu = [
    { icon: ShoppingBag, label: 'My RFQs', link: createPageUrl('BuyerDashboard') },
    { icon: FileText, label: 'My Orders', link: createPageUrl('Orders') },
    { icon: MessageCircle, label: 'Messages', link: createPageUrl('Messages') },
    { icon: BarChart3, label: 'Analytics', link: createPageUrl('Analytics') }
  ];

  const sellerMenu = [
    { icon: Package, label: 'My Products', link: createPageUrl('SellerDashboard') },
    { icon: Package, label: 'Add Product', link: createPageUrl('AddProduct') },
    { icon: FileText, label: 'My Orders', link: createPageUrl('Orders') },
    { icon: MessageCircle, label: 'Messages', link: createPageUrl('Messages') },
    { icon: BarChart3, label: 'Analytics', link: createPageUrl('Analytics') }
  ];

  const adminMenu = [
    { icon: Users, label: 'Users', link: createPageUrl('AdminDashboard') },
    { icon: Package, label: 'Products', link: createPageUrl('Products') },
    { icon: FileText, label: 'Orders', link: createPageUrl('Orders') },
    { icon: BarChart3, label: 'Analytics', link: createPageUrl('Analytics') },
    { icon: Settings, label: 'Settings', link: '#' }
  ];

  const logisticsMenu = [
    { icon: Truck, label: 'Orders', link: createPageUrl('LogisticsDashboard') },
    { icon: MessageCircle, label: 'Messages', link: createPageUrl('Messages') },
    { icon: BarChart3, label: 'Analytics', link: createPageUrl('Analytics') }
  ];

  const getMenu = () => {
    switch (activeRole) {
      case 'buyer': return buyerMenu;
      case 'seller': return sellerMenu;
      case 'admin': return adminMenu;
      case 'logistics_partner': return logisticsMenu;
      default: return buyerMenu;
    }
  };

  const menu = getMenu();

  return (
    <div className="w-64 bg-afrikoni-offwhite border-r border-afrikoni-gold/20 min-h-screen">
      <div className="p-6 border-b border-afrikoni-gold/20">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center">
            <span className="text-afrikoni-creamfont-bold text-xl">A</span>
          </div>
          <span className="text-xl font-bold text-afrikoni-chestnut">AFRIKONI</span>
        </Link>
      </div>
      <nav className="p-4 space-y-2">
        {menu.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.link;
          return (
            <Link
              key={idx}
              to={item.link}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-amber-50 text-amber-600 font-semibold'
                  : 'text-afrikoni-deep hover:bg-afrikoni-offwhite'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

