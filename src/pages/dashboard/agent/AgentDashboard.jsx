import React from 'react';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { useAuth } from '@/contexts/AuthProvider';
import { useRole } from '@/contexts/RoleContext';
import { PlusCircle, ShieldCheck, DollarSign, Users, ExternalLink, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AgentDashboard() {
    const { user } = useAuth();
    const { isAgent } = useRole();
    const navigate = useNavigate();

    // If not agent, show restricted access
    if (!isAgent) {
        return (
            <div className="p-8 text-center text-white">
                <h1 className="text-2xl font-bold mb-4">Restricted Access</h1>
                <p>This portal is for authorized field agents only.</p>
                <Button onClick={() => navigate('/dashboard')} className="mt-4">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    // Mock data for MVP
    const stats = {
        verifiedSuppliers: 12,
        pendingVerifications: 3,
        commissionEarned: 450.00,
        rank: 'Field Officer II'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Field Agent Portal</h1>
                    <p className="text-white/60">Welcome back, {user?.user_metadata?.full_name || 'Agent'}</p>
                </div>
                <div className="flex items-center gap-2 bg-os-accent/10 px-4 py-2 rounded-full border border-os-accent/20">
                    <ShieldCheck className="w-4 h-4 text-os-accent" />
                    <span className="text-sm font-medium text-os-accent">{stats.rank}</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Surface className="p-6 border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-white/60">Verified Suppliers</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.verifiedSuppliers}</p>
                </Surface>

                <Surface className="p-6 border-l-4 border-l-yellow-500">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-white/60">Pending Review</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{stats.pendingVerifications}</p>
                </Surface>

                <Surface className="p-6 border-l-4 border-l-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-white/60">Commission Earned</span>
                    </div>
                    <p className="text-3xl font-bold text-white">${stats.commissionEarned.toFixed(2)}</p>
                </Surface>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Surface className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <PlusCircle className="w-6 h-6 text-os-accent" />
                        <h2 className="text-lg font-bold text-white">Onboard New Supplier</h2>
                    </div>
                    <p className="text-sm text-white/60">
                        Register a new business, capture their KYC documents, and initiate verification.
                        (Earn $50 per verified supplier)
                    </p>
                    <Button
                        onClick={() => navigate('/dashboard/agent/onboard-supplier')}
                        className="w-full bg-os-accent text-black font-bold h-12"
                    >
                        Start Onboarding
                    </Button>
                </Surface>

                <Surface className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-6 h-6 text-blue-400" />
                        <h2 className="text-lg font-bold text-white">Site Visit Verification</h2>
                    </div>
                    <p className="text-sm text-white/60">
                        Visit a supplier's facility, take photos, and confirm production capacity.
                        (Earn $100 per site visit)
                    </p>
                    <Button
                        onClick={() => navigate('/dashboard/agent/site-visit')}
                        variant="outline"
                        className="w-full h-12 border-white/20 text-white hover:bg-white/5"
                    >
                        Start Site Visit
                    </Button>
                </Surface>
            </div>

            {/* Recent Activity Mock */}
            <Surface className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[
                        { id: 1, action: 'Verified Supplier', target: 'Kente Weavers Ltd', date: '2 hours ago', earnings: '+$50.00' },
                        { id: 2, action: 'Site Visit', target: 'Accra Textile Mill', date: 'Yesterday', earnings: '+$100.00' },
                        { id: 3, action: 'Supplier Registered', target: 'Golden Shea Co-op', date: '2 days ago', earnings: 'Pending' },
                    ].map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-white">{item.action}</p>
                                <p className="text-xs text-white/50">{item.target} • {item.date}</p>
                            </div>
                            <span className={`text-sm font-bold ${item.earnings.includes('+') ? 'text-green-400' : 'text-yellow-400'}`}>
                                {item.earnings}
                            </span>
                        </div>
                    ))}
                </div>
            </Surface>
        </div>
    );
}
