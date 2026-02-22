import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Input } from '@/components/shared/ui/input';
import { Surface } from '@/components/system/Surface';
import Price from '@/components/shared/ui/Price';
import { ArrowLeft, ShieldCheck, Package, ShoppingBag, Truck, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createTrade, TRADE_STATE } from '@/services/tradeKernel';
import { PageLoader } from '@/components/shared/ui/skeletons';
import { cn } from '@/lib/utils';
import { getPrimaryImageFromProduct } from '@/utils/productImages';

export default function CheckoutPage() {
    const { user, profile, authReady } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Checkout State
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const productId = params.get('product');

        if (!productId) {
            toast.error('No product selected');
            navigate(`/${language}/marketplace`);
            return;
        }

        loadProduct(productId);
    }, [location.search]);

    const loadProduct = async (id) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*, companies(*)')
                .eq('id', id)
                .single();

            if (error || !data) throw error || new Error('Product not found');

            setProduct(data);
            setQuantity(data.min_order_quantity || 1);
        } catch (err) {
            toast.error('Failed to load product');
            navigate(`/${language}/marketplace`);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        if (!product) return 0;
        // Basic calculation - in real app, handle bulk pricing tiers
        const price = product.price || product.price_min || 0;
        return price * quantity;
    };

    const handlePlaceOrder = async () => {
        if (!user || !profile?.company_id) {
            toast.error('Please complete your profile first');
            return;
        }

        const toastId = toast.loading('Initiating trade rail...');
        setSubmitting(true);

        try {
            const result = await createTrade({
                trade_type: 'order',
                buyer_id: profile.company_id,
                created_by: user.id,
                title: `Direct Purchase: ${product.name || 'Product'}`,
                description: notes || `Direct purchase of ${product.name || 'Product'}`,
                category_id: product.category_id,
                quantity: quantity,
                quantity_unit: product.unit || 'units',
                target_price: product.price || product.price_min,
                currency: product.currency || 'USD',
                status: TRADE_STATE.CONTRACTED,
                metadata: {
                    product_id: product.id,
                    supplier_id: product.company_id,
                    checkout_source: 'direct_buy'
                }
            });

            if (result.success) {
                toast.success('Trade started successfully!', { id: toastId });
                navigate(`/${language}/dashboard/trades/${result.data.id}?success=true`);
            } else {
                toast.error(result.error || 'Failed to start trade', { id: toastId });
            }
        } catch (err) {
            toast.error('Something went wrong', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !authReady) return <PageLoader />;

    return (
        <div className="min-h-screen bg-os-bg py-12 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-8 hover:bg-os-surface-1"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Product
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Order Configuration */}
                    <div className="lg:col-span-2 space-y-8">
                        <h1 className="text-3xl font-black tracking-tighter uppercase">
                            CONFIRM <span className="text-os-accent">TRADE</span> ORDER
                        </h1>

                        <Surface variant="panel" className="p-8">
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-os-sm overflow-hidden border border-os-stroke shrink-0">
                                    <img
                                        src={getPrimaryImageFromProduct(product)}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{product.name}</h2>
                                    <p className="text-os-sm text-os-text-secondary mt-1">
                                        Supplier: <span className="font-bold text-os-text-primary">{product.companies?.company_name}</span>
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <Price
                                            amount={product.price || product.price_min}
                                            fromCurrency={product.currency}
                                            className="text-os-lg font-black text-os-accent"
                                        />
                                        <span className="text-os-sm text-os-text-secondary self-end mb-1">/ {product.unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-os-stroke">
                                <div className="space-y-4">
                                    <label className="os-label !text-os-text-primary">Order Quantity</label>
                                    <div className="flex items-center gap-4">
                                        <Input
                                            type="number"
                                            min={product.min_order_quantity || 1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="w-32 text-lg font-bold"
                                        />
                                        <span className="text-os-sm font-mono uppercase tracking-widest opacity-50">
                                            {product.unit || 'Units'}
                                        </span>
                                    </div>
                                    {quantity < (product.min_order_quantity || 1) && (
                                        <p className="flex items-center gap-1.5 text-os-error text-os-xs font-bold uppercase">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Min Order: {product.min_order_quantity}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <label className="os-label !text-os-text-primary">Notes to Supplier (Optional)</label>
                                    <textarea
                                        className="w-full bg-black/20 border border-os-stroke rounded-os-sm p-4 text-os-sm focus:border-os-accent outline-none transition-colors"
                                        rows={3}
                                        placeholder="Specific requirements, packaging preference, etc."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </Surface>

                        <Surface variant="glass" className="p-6 border-blue-500/20 flex gap-4">
                            <Info className="w-6 h-6 text-blue-500 shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-400 uppercase tracking-widest text-os-xs mb-1">Afrikoni Secure Execution</h4>
                                <p className="text-os-xs text-os-text-secondary">
                                    Your payment will be held in a multi-sig escrow protected by the Afrikoni Secure rail.
                                    Funds are only released to the supplier once you confirm delivery acceptance.
                                </p>
                            </div>
                        </Surface>
                    </div>

                    {/* Price Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <Surface variant="panel" className="p-8 border-os-accent/20 bg-os-accent/5 backdrop-blur-xl">
                                <h3 className="os-label !text-os-accent mb-6 font-black tracking-[0.2em]">TRADE SUMMARY</h3>

                                <div className="space-y-4 font-mono text-os-sm">
                                    <div className="flex justify-between items-center opacity-70">
                                        <span>Subtotal</span>
                                        <Price amount={calculateTotal()} fromCurrency={product.currency} />
                                    </div>
                                    <div className="flex justify-between items-center opacity-70">
                                        <span>Platform Fee (2%)</span>
                                        <Price amount={calculateTotal() * 0.02} fromCurrency={product.currency} />
                                    </div>
                                    <div className="flex justify-between items-center opacity-70">
                                        <span>Logistic Est.</span>
                                        <span className="text-os-xs font-bold text-emerald-500">QUOTE PENDING</span>
                                    </div>
                                    <div className="pt-4 border-t border-os-stroke flex justify-between items-end">
                                        <span className="text-os-xs uppercase font-bold">Total Value</span>
                                        <Price
                                            amount={calculateTotal() * 1.02}
                                            fromCurrency={product.currency}
                                            className="text-2xl font-black text-os-accent"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={submitting || quantity < (product.min_order_quantity || 1)}
                                    className="w-full mt-10 h-14 bg-os-accent text-os-bg font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-glow"
                                >
                                    {submitting ? 'Initiating Rail...' : 'Confirm & Start Trade'}
                                </Button>

                                <div className="mt-8 flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Trust Rail</span>
                                    </div>
                                    <p className="text-[9px] text-center text-os-text-secondary leading-relaxed px-4">
                                        By confirming, you agree to the Afrikoni Trade Agreement and Escrow Protection Policy.
                                    </p>
                                </div>
                            </Surface>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
