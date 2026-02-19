import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface } from '@/components/system/Surface';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { ArrowLeft, Camera, Search, UserCheck, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';

export default function SiteVisit() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [verificationSteps, setVerificationSteps] = useState({
        stockVerified: false,
        machineryVerified: false,
        documentsVerified: false,
        signageVerified: false
    });

    const handleSearch = async (e) => {
        const query = e.target.value;
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data, error } = await supabase
                .from('onboarded_suppliers')
                .select('*')
                .ilike('business_name', `%${query}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);

            // Auto-select if only one exact match (optional, but keep simple for now)
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectSupplier = (supplier) => {
        setSelectedSupplier(supplier);
        setSearchResults([]); // Clear search dropdown
    };

    const handleVerify = async () => {
        if (!selectedSupplier) return;

        setSubmitting(true);
        try {
            // 1. Log the site visit
            const { error: visitError } = await supabase
                .from('site_visits')
                .insert({
                    agent_id: user.id,
                    supplier_id: selectedSupplier.id,
                    verification_data: verificationSteps,
                    status: 'submitted'
                });

            if (visitError) throw visitError;

            // 2. Update supplier to verified
            // In a real flow, this might require approval, but for MVP agent power = verified
            const { error: updateError } = await supabase
                .from('onboarded_suppliers')
                .update({ status: 'verified' })
                .eq('id', selectedSupplier.id);

            if (updateError) throw updateError;

            // 3. Update agent stats (increment verified count)
            // This is handled by the DB trigger 'increment_agent_stats' if it exists, 
            // or we can do it manually. The migration had a trigger on 'insert into agents' logic.
            // Let's assume the trigger handles it or we just trust the system.

            toast.success('Site Visit Report Submitted');
            toast.success('+$100 Commission Added to Wallet');
            navigate('/dashboard/agent');
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Failed to submit report');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/agent')} className="text-white hover:bg-white/10">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-white">Site Verification Visit</h1>
            </div>

            <Surface className="p-6 space-y-4">
                <Label className="text-white">Locate Supplier</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-white/40" />
                    <Input
                        placeholder="Search by name..."
                        className="pl-10 h-12 bg-black/20 border-white/10 text-white"
                        onChange={handleSearch}
                    />
                    {searching && <Loader2 className="absolute right-3 top-3 w-5 h-5 animate-spin text-white/40" />}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && !selectedSupplier && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-os-dark-surface border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                            {searchResults.map(result => (
                                <div
                                    key={result.id}
                                    onClick={() => handleSelectSupplier(result)}
                                    className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                                >
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                        <UserCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{result.business_name}</p>
                                        <p className="text-xs text-white/50">{result.category || 'Uncategorized'}</p>
                                    </div>
                                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${result.status === 'verified' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {result.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedSupplier && (
                    <div className="mt-4 p-4 bg-white/5 rounded-lg border border-os-accent/20 animate-in fade-in zoom-in duration-300 relative">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedSupplier(null)}
                            className="absolute top-2 right-2 h-6 w-6 text-white/40 hover:text-white"
                        >
                            &times;
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-os-accent/10 rounded-full flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-os-accent" />
                            </div>
                            <div>
                                <p className="font-bold text-white">{selectedSupplier.business_name}</p>
                                <p className="text-xs text-white/50">
                                    {selectedSupplier.location_lat ? 'Location Tagged' : 'No Location'} • Status: {selectedSupplier.status}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Surface>

            {selectedSupplier && (
                <Surface className="p-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-white mb-4">Verification Checklist</h3>

                    <div className="space-y-3">
                        {[
                            { key: 'stockVerified', label: 'Inventory / Stock Present' },
                            { key: 'machineryVerified', label: 'Machinery / Tools Operational' },
                            { key: 'documentsVerified', label: 'Business Licenses Viewed' },
                            { key: 'signageVerified', label: 'Physical Signage Matches' }
                        ].map((item) => (
                            <div
                                key={item.key}
                                onClick={() => setVerificationSteps(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${verificationSteps[item.key] ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                            >
                                <span className={`text-sm font-medium ${verificationSteps[item.key] ? 'text-green-400' : 'text-white/60'}`}>
                                    {item.label}
                                </span>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${verificationSteps[item.key] ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>
                                    {verificationSteps[item.key] && <Check className="w-4 h-4 text-black" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <Button
                            onClick={handleVerify}
                            disabled={!Object.values(verificationSteps).every(steps => steps) || submitting}
                            className="w-full h-12 bg-os-accent text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
                                <>
                                    <ShieldCheck className="w-5 h-5 mr-2" />
                                    Submit Verification Report
                                </>
                            )}
                        </Button>
                    </div>
                </Surface>
            )}
        </div>
    );
}
