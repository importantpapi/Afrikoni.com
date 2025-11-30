import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, Package, AlertCircle, Calendar, DollarSign, Plus, Eye, MapPin
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, StatusChip } from '@/components/ui/data-table';
import { mockLogisticsStats } from '@/data/mockData';

export default function LogisticsDashboardHome() {
  const quickActions = [
    { icon: Plus, label: 'Create Shipping Offer', link: '/dashboard/shipments/create', color: 'orange' },
    { icon: Eye, label: 'View Shipments', link: '/dashboard/shipments', color: 'blue' },
    { icon: MapPin, label: 'Track Fleet', link: '/dashboard/fleet', color: 'green' },
    { icon: Package, label: 'Upload Documents', link: '/dashboard/documents', color: 'purple' }
  ];

  const mockShipments = [
    {
      id: 'SHIP-001',
      origin: 'Lagos, Nigeria',
      destination: 'Accra, Ghana',
      eta: '2025-02-05',
      status: 'in_transit',
      cargo: '500 KG Cocoa Beans'
    },
    {
      id: 'SHIP-002',
      origin: 'Cairo, Egypt',
      destination: 'Lagos, Nigeria',
      eta: '2025-02-08',
      status: 'pending',
      cargo: '2000 meters Fabric'
    },
    {
      id: 'SHIP-003',
      origin: 'Dakar, Senegal',
      destination: 'Abidjan, Côte d\'Ivoire',
      eta: '2025-02-03',
      status: 'delivered',
      cargo: '1000 KG Shea Butter'
    }
  ];

  const shipmentColumns = [
    { header: 'Shipment ID', accessor: 'id' },
    { header: 'Origin', accessor: 'origin' },
    { header: 'Destination', accessor: 'destination' },
    { header: 'ETA', accessor: 'eta' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusChip status={value === 'in_transit' ? 'processing' : value === 'pending' ? 'pending' : 'delivered'} />
    }
  ];

  return (
    <div className="space-y-3">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Truck}
          label="Active Shipments"
          value={mockLogisticsStats.activeShipments.toString()}
          color="orange"
        />
        <StatCard
          icon={Package}
          label="Deliveries This Week"
          value={mockLogisticsStats.deliveriesThisWeek.toString()}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          label="Delayed Shipments"
          value={mockLogisticsStats.delayedShipments.toString()}
          color="warning"
        />
        <StatCard
          icon={Calendar}
          label="Pickups Today"
          value={mockLogisticsStats.pickupsToday.toString()}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value={`$${mockLogisticsStats.revenueThisMonth.toLocaleString()}`}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link key={idx} to={action.link}>
              <Card hover className="text-center">
                <CardContent className="p-4">
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="text-sm font-semibold text-afrikoni-chestnut">{action.label}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Shipment Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Shipments</CardTitle>
                <Link to="/dashboard/shipments">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={shipmentColumns}
                data={mockShipments}
                onRowClick={(row) => {
                  // Navigate to shipment detail page
                  // navigate(`/shipment?id=${row.id}`);
                }}
              />
            </CardContent>
          </Card>

          {/* Performance Chart */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>On-Time Delivery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-afrikoni-offwhite rounded-lg">
                <p className="text-afrikoni-deep/70 text-sm">Chart placeholder - 94% on-time delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Logistics RFQs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logistics RFQs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 border border-afrikoni-gold/20 rounded-lg hover:bg-afrikoni-offwhite">
                    <div className="font-semibold text-sm mb-1">Route Request {i}</div>
                    <div className="text-xs text-afrikoni-deep mb-2">Lagos → Accra • 500 KG</div>
                    <Badge variant="info" className="text-xs">2 offers</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Logistics Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Logistics Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-1">Route Suggestion</p>
                  <p className="text-xs text-blue-700">
                    Lagos → Accra route has 15% lower costs via sea freight this week.
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-900 font-semibold mb-1">Delay Warning</p>
                  <p className="text-xs text-yellow-700">
                    Weather delays expected on Cairo → Lagos route. Consider alternative.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
