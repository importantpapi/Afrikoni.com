/**
 * ============================================================================
 * useAIActions Hook - AI-Powered Action Suggestions
 * ============================================================================
 * 
 * Analyzes user's trades, RFQs, products to generate prioritized actions.
 * 
 * Priority Calculation:
 * - Urgent: Time-sensitive (expires < 24h, delays, risks)
 * - Recommended: High impact (pricing, new RFQs, documents)
 * - Opportunity: Growth (new corridors, returning buyers, unlocks)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';

export function useAIActions() {
    const { user, profile } = useAuth();
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile?.company_id) {
            loadActions();
        }
    }, [user, profile?.company_id]);

    const loadActions = async () => {
        setLoading(true);
        try {
            // Fetch user's data
            const [rfqsRes, tradesRes, productsRes] = await Promise.all([
                supabase
                    .from('rfqs')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('trades')
                    .select('*')
                    .or(`buyer_id.eq.${profile.company_id},seller_id.eq.${profile.company_id}`)
                    .order('created_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('products')
                    .select('*')
                    .eq('company_id', profile.company_id)
                    .limit(10),
            ]);

            const rfqs = rfqsRes.data || [];
            const trades = tradesRes.data || [];
            const products = productsRes.data || [];

            // Generate actions based on data
            const generatedActions = [];

            // 1. URGENT: Expiring RFQs
            rfqs.forEach(rfq => {
                if (rfq.status === 'sent' && rfq.expires_at) {
                    const hoursLeft = (new Date(rfq.expires_at) - new Date()) / (1000 * 60 * 60);
                    if (hoursLeft > 0 && hoursLeft < 24) {
                        generatedActions.push({
                            id: `rfq-expiring-${rfq.id}`,
                            type: 'rfq',
                            priority: 'urgent',
                            title: `RFQ expires in ${Math.round(hoursLeft)}h`,
                            description: `"${rfq.title}" - Review quotes before deadline`,
                            path: `/dashboard/rfqs/${rfq.id}`,
                            actionLabel: 'View Quotes',
                            metadata: {
                                timeLeft: `${Math.round(hoursLeft)}h left`,
                                count: `${rfq.quotes_count || 0} quotes`,
                            },
                        });
                    }
                }
            });

            // 2. URGENT: Delayed shipments
            trades.forEach(trade => {
                if (['in_transit', 'pickup_scheduled'].includes(trade.status) && trade.expected_delivery) {
                    const daysOverdue = Math.floor((new Date() - new Date(trade.expected_delivery)) / (1000 * 60 * 60 * 24));
                    if (daysOverdue > 0) {
                        generatedActions.push({
                            id: `shipment-delayed-${trade.id}`,
                            type: 'shipment',
                            priority: 'urgent',
                            title: `Shipment delayed ${daysOverdue}d`,
                            description: `Trade #${trade.id.slice(0, 8)} - Contact logistics partner`,
                            path: `/dashboard/trade/${trade.id}`,
                            actionLabel: 'Contact Logistics',
                            metadata: {
                                timeLeft: `${daysOverdue}d overdue`,
                            },
                        });
                    }
                }
            });

            // 3. RECOMMENDED: New RFQs matching products
            if (products.length > 0) {
                // Mock: In real implementation, this would query for matching RFQs
                const matchingRFQs = 3; // Mock count
                if (matchingRFQs > 0) {
                    generatedActions.push({
                        id: 'matching-rfqs',
                        type: 'rfq',
                        priority: 'recommended',
                        title: `${matchingRFQs} new RFQs match your products`,
                        description: 'Review and submit quotes to win new business',
                        path: '/dashboard/supplier-rfqs',
                        actionLabel: 'Review RFQs',
                        metadata: {
                            count: `${matchingRFQs} matches`,
                        },
                    });
                }
            }

            // 4. RECOMMENDED: Pricing below corridor average
            products.forEach(product => {
                // Mock: In real implementation, compare with corridor data
                const corridorAvg = 2800;
                const userPrice = product.price || 0;
                if (userPrice > 0 && userPrice < corridorAvg * 0.85) {
                    generatedActions.push({
                        id: `pricing-low-${product.id}`,
                        type: 'pricing',
                        priority: 'recommended',
                        title: 'Your pricing is 15% below corridor average',
                        description: `"${product.name}" - Consider adjusting to increase margins`,
                        path: `/dashboard/products/${product.id}`,
                        actionLabel: 'Adjust Price',
                        metadata: {
                            value: `$${corridorAvg}/MT avg`,
                        },
                    });
                }
            });

            // 5. RECOMMENDED: Missing documents
            trades.forEach(trade => {
                if (['contracted', 'escrow_required'].includes(trade.status) && !trade.documents_verified) {
                    generatedActions.push({
                        id: `docs-missing-${trade.id}`,
                        type: 'compliance',
                        priority: 'recommended',
                        title: 'Upload trade documents',
                        description: `Trade #${trade.id.slice(0, 8)} - Required for escrow release`,
                        path: `/dashboard/trade/${trade.id}`,
                        actionLabel: 'Upload Docs',
                    });
                }
            });

            // 6. OPPORTUNITY: New corridor opened
            // Mock: In real implementation, check for new active corridors
            generatedActions.push({
                id: 'new-corridor',
                type: 'opportunity',
                priority: 'opportunity',
                title: 'New corridor opened: Ghana → UAE',
                description: 'Explore opportunities in this growing trade route',
                path: '/dashboard/corridors',
                actionLabel: 'Explore',
            });

            // 7. OPPORTUNITY: Returning buyer
            // Mock: In real implementation, detect returning buyers
            if (rfqs.length > 0) {
                generatedActions.push({
                    id: 'returning-buyer',
                    type: 'opportunity',
                    priority: 'opportunity',
                    title: 'Buyer you quoted last week is back',
                    description: 'Follow up to close the deal',
                    path: '/dashboard/rfqs',
                    actionLabel: 'Follow Up',
                });
            }

            // Sort by priority
            const priorityOrder = { urgent: 0, recommended: 1, opportunity: 2 };
            generatedActions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            setActions(generatedActions);
        } catch (err) {
            console.error('Failed to load actions:', err);
            setActions([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsCompleted = async (actionId) => {
        // Track action completion for analytics
        try {
            await supabase.from('user_actions').insert({
                user_id: user.id,
                company_id: profile.company_id,
                action_id: actionId,
                completed_at: new Date().toISOString(),
            });

            // Remove from local state
            setActions(prev => prev.filter(a => a.id !== actionId));
        } catch (err) {
            console.error('Failed to mark action as completed:', err);
        }
    };

    return {
        actions,
        loading,
        markAsCompleted,
        refresh: loadActions,
    };
}
