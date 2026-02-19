import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Users, Clock, TrendingDown, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';

export default function GroupBuyModal({ isOpen, onClose, product }) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [quantity, setQuantity] = useState('');
    const [joining, setJoining] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pool, setPool] = useState(null);

    useEffect(() => {
        if (isOpen && product) {
            loadPool();
        }
    }, [isOpen, product]);

    const loadPool = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('group_buy_pools')
                .select('*')
                .eq('product_id', product.id)
                .eq('status', 'open')
                .maybeSingle();

            if (error) throw error;
            setPool(data);
        } catch (err) {
            console.error('Error loading pool:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateDiscount = () => {
        // Determine discount tier based on existing pool + new qty
        // For MVP, flat 15% discount if pool target reached
        const regular = product.price || 0;
        const discount = regular * 0.85; // 15% off
        return { regular, discount };
    };

    const handleJoin = async () => {
        if (!user) {
            toast.error('Please login to join a group buy');
            return;
        }
        if (!quantity || parseInt(quantity) <= 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        setJoining(true);
        try {
            let currentPool = pool;

            // 1. Create pool if doesn't exist
            if (!currentPool) {
                const targetQty = product.min_order_quantity || 500; // Default target
                const { data: newPool, error: createError } = await supabase
                    .from('group_buy_pools')
                    .insert({
                        product_id: product.id,
                        target_quantity: targetQty,
                        current_quantity: 0,
                        discount_price: product.price ? product.price * 0.85 : 0,
                        regular_price: product.price,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                        status: 'open'
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                currentPool = newPool;
            }

            // 2. Add member
            const { error: joinError } = await supabase
                .from('group_buy_members')
                .insert({
                    pool_id: currentPool.id,
                    user_id: user.id,
                    quantity: parseInt(quantity),
                    status: 'committed'
                });

            if (joinError) throw joinError;

            toast.success('You joined the pool!', {
                description: `We'll notify you when the target of ${currentPool.target_quantity} units is reached.`
            });
            onClose();
        } catch (error) {
            console.error('Join error:', error);
            toast.error('Failed to join pool');
        } finally {
            setJoining(false);
        }
    };

    if (!isOpen) return null;

    // Default values if no pool exists yet
    const target = pool?.target_quantity || product.min_order_quantity || 500;
    const current = pool?.current_quantity || 0;
    const progress = Math.min((current / target) * 100, 100);
    const remaining = Math.max(target - current, 0);
    const deadline = pool ? new Date(pool.expires_at).toLocaleDateString() : '7 days left';

    const { regular, discount } = calculateDiscount();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-os-surface-base border-os-stroke text-os-text-primary">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Group Buy: {product.title}</DialogTitle>
                            <DialogDescription className="text-os-text-secondary">
                                {pool ? 'Active Pool available!' : 'Start a new Group Buy Pool'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Progress Section */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-blue-400">{current} committed</span>
                                <span className="text-os-text-secondary">Target: {target} units</span>
                            </div>
                            <div className="h-3 bg-os-surface-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-os-text-secondary text-center">
                                Only <span className="text-os-text-primary font-bold">{remaining} more units</span> needed to trigger shipment!
                            </p>
                        </div>

                        {/* Benefits Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-green-400" />
                                    <span className="text-xs font-bold text-green-400">BULK PRICE</span>
                                </div>
                                <p className="text-lg font-bold">{product.currency || '$'} {discount.toLocaleString()}</p>
                                <p className="text-xs text-os-text-secondary line-through">
                                    {product.currency || '$'} {regular.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-bold text-orange-400">CLOSES IN</span>
                                </div>
                                <p className="text-lg font-bold">{deadline}</p>
                                <p className="text-xs text-os-text-secondary">Act fast</p>
                            </div>
                        </div>

                        {/* User Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Your Quantity Commitment</label>
                            <div className="flex gap-4">
                                <Input
                                    type="number"
                                    placeholder="e.g. 50"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="bg-os-surface-1 border-os-stroke h-12 text-lg"
                                />
                                <div className="flex flex-col justify-center text-xs text-os-text-secondary w-32">
                                    <span>Total Est:</span>
                                    <span className="font-bold text-os-text-primary">
                                        {product.currency || '$'} {quantity ? (parseInt(quantity) * discount).toLocaleString() : '0'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trust Note */}
                        <div className="flex gap-3 p-3 bg-os-surface-1 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-os-text-secondary shrink-0" />
                            <p className="text-xs text-os-text-secondary">
                                No payment is taken today. You only pay when the pool hits {target} units.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={joining}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleJoin}
                        disabled={joining || !quantity || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                    >
                        {joining ? (pool ? 'Joining...' : 'Starting Pool...') : (pool ? 'Join Pool' : 'Start Pool')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
