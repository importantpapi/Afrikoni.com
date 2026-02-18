import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { calculateTradeFees, estimateFX } from '@/services/revenueEngine';
import { predictHSCode, calculateDutySavings } from '@/services/taxShield';
import { scanForLeakage } from '@/services/forensicSentinel';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { secureStorage } from '@/utils/secureStorage';

/**
 * TRADE CONTEXT (The Kernel)
 * 
 * "The Unbroken Flow" State Machine.
 * Binds Product DNA, Money Map, and Pulse Rail into one immutable truth.
 */

const TradeContext = createContext();

// INITIAL STATE
const initialState = {
    tradeId: null,
    status: 'idle', // idle, active, suspended, completed

    // 1. PRODUCT DNA (The Goods)
    product: {
        name: '',
        category: '',
        hsCode: null,
        compliance: {
            dutyFree: false,
            oneFlowPackGenerated: false,
            savings: 0
        },
        documents: []
    },

    // 2. MONEY MAP (The Capital)
    financials: {
        totalValueUSD: 0,
        currency: 'USD',
        localCurrency: 'NGN', // Default pivot
        exchangeRate: 0,
        escrowState: 'locked', // locked, funded, verified, released
        fees: {
            platform: 0,
            service: 0,
            fxSpread: 0
        }
    },

    // 3. PULSE RAIL (The Journey)
    logistics: {
        origin: '',
        destination: '',
        currentMilestone: 0,
        riskScore: 0, // 0-100 (High is bad)
        milestones: [
            { id: 'init', label: 'Trade Initiated', status: 'completed', evidence: 'Digital Signature' },
            { id: 'escrow', label: 'Escrow Funded', status: 'pending', evidence: 'Bank Confirmation' },
            { id: 'origin_logistics', label: 'Origin Logistics', status: 'pending', evidence: 'GPS + Photo' },
            { id: 'customs_export', label: 'Export Clearance', status: 'pending', evidence: 'One-Flow Pack' },
            { id: 'freight', label: 'International Freight', status: 'pending', evidence: 'Bill of Lading' },
            { id: 'customs_import', label: 'Import Clearance', status: 'pending', evidence: 'Terminal Receipt' },
            { id: 'final_delivery', label: 'Final Delivery', status: 'pending', evidence: 'POD + Inspect' }
        ]
    },

    // 4. INTELLIGENCE (The Griot)
    advice: {
        message: 'Waiting for trade initiation...',
        actionUrl: null,
        tone: 'neutral'
    }
};

// REDUCER
function tradeReducer(state, action) {
    switch (action.type) {
        case 'INITIATE_TRADE':
            return {
                ...state,
                tradeId: `TRD-${Date.now().toString(36).toUpperCase()}`,
                status: 'active',
                product: { ...state.product, ...action.payload.product },
                financials: { ...state.financials, ...action.payload.financials },
                logistics: { ...state.logistics, ...action.payload.logistics },
                advice: {
                    message: 'Trade Initiated. Next Step: Fund the Sovereign Escrow to unlock the One-Flow Pack.',
                    tone: 'info'
                }
            };

        case 'UPDATE_FINANCIALS':
            return {
                ...state,
                financials: { ...state.financials, ...action.payload }
            };

        case 'GENERATE_ONE_FLOW':
            return {
                ...state,
                product: {
                    ...state.product,
                    compliance: {
                        ...state.product.compliance,
                        oneFlowPackGenerated: true,
                        hsCode: action.payload.hsCode,
                        savings: action.payload.savings,
                        dutyFree: action.payload.savings > 0
                    }
                },
                advice: {
                    message: `One-Flow Pack Generated. You saved ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(action.payload.savings)} in duties.`,
                    tone: 'success'
                }
            };

        case 'UPDATE_MILESTONE':
            const newMilestones = state.logistics.milestones.map(m =>
                m.id === action.payload.id ? { ...m, status: action.payload.status, evidence: action.payload.evidence || m.evidence } : m
            );
            return {
                ...state,
                logistics: { ...state.logistics, milestones: newMilestones },
                advice: {
                    message: `Milestone Updated: ${action.payload.id}. Trace Center updated.`,
                    tone: 'info'
                }
            };

        case 'SET_RISK_SCORE':
            return {
                ...state,
                logistics: { ...state.logistics, riskScore: action.payload },
                advice: {
                    message: action.payload > 50 ? 'High Risk Detected. Sentinel Protocol Active.' : state.advice.message,
                    tone: action.payload > 50 ? 'critical' : state.advice.tone
                }
            };

        default:
            return state;
    }
}

// PROVIDER
export function TradeProvider({ children }) {
    // 1. Load from Persistence (Offline Hardening) - NOW ENCRYPTED 🔒
    const [state, dispatch] = useReducer(tradeReducer, initialState, (defaultState) => {
        if (typeof window !== 'undefined') {
            const cached = secureStorage.get('active_trade_session');
            if (cached) {
                try {
                    return typeof cached === 'string' ? JSON.parse(cached) : cached;
                } catch (e) {
                    console.warn('Failed to parse cached trade session, cleaning up');
                    secureStorage.remove('active_trade_session');
                }
            }
        }
        return defaultState;
    });

    const { isOnline } = useNetworkStatus();

    // 2. Persist State on Change - NOW ENCRYPTED 🔒
    useEffect(() => {
        if (state.tradeId) {
            secureStorage.set('active_trade_session', state);
        }
    }, [state]);

    // ACTIONS

    /**
     * Start a new trade flow. Triggers Fee Calculation & FX Estimation.
     */
    const initiateTrade = (productData, financialData, logisticsData) => {
        // Calculate Fees
        const fees = calculateTradeFees(financialData.amountUSD);

        // Estimate FX if local currency provided
        let fxRate = 1;
        if (financialData.localCurrency && financialData.localCurrency !== 'USD') {
            const fx = estimateFX(1, financialData.localCurrency);
            fxRate = fx.rate;
        }

        dispatch({
            type: 'INITIATE_TRADE',
            payload: {
                product: productData,
                financials: {
                    totalValueUSD: financialData.amountUSD,
                    currency: 'USD',
                    localCurrency: financialData.localCurrency || 'NGN',
                    exchangeRate: fxRate,
                    escrowState: 'locked',
                    fees: fees.breakdown
                },
                logistics: logisticsData
            }
        });

        // Trigger Auto-Compliance
        runAutoCompliance(productData);
    };

    /**
     * Auto-Compliance: Predict HS Code and Calculate Duty Savings
     */
    const runAutoCompliance = async (productData) => {
        // Offline Guard
        if (!isOnline) {
            dispatch({
                type: 'UPDATE_MILESTONE', // Generic update to logs
                payload: { id: 'compliance_check', status: 'pending', evidence: 'Queued (Offline)' }
            });
            return;
        }

        // Simulate async AI delay
        setTimeout(() => {
            const prediction = predictHSCode(productData.name);
            if (prediction) {
                const savings = calculateDutySavings(prediction.code, 50000); // Mock value for now

                dispatch({
                    type: 'GENERATE_ONE_FLOW',
                    payload: {
                        hsCode: prediction.code,
                        savings: savings.savingsAmount
                    }
                });
            }
        }, 1200);
    };

    /**
     * Verify a Milestone with Evidence (Documents/GPS/Photos)
     */
    const verifyMilestone = (milestoneId, evidenceData) => {
        // In a real app, this would verify the evidence with Sentinel/Vision AI
        console.log(`Verifying milestone ${milestoneId} with evidence:`, evidenceData);

        dispatch({
            type: 'UPDATE_MILESTONE',
            payload: {
                id: milestoneId,
                status: 'completed',
                evidence: 'AI Verified'
            }
        });

        // If it's the "init" milestone, we might want to update advice
        if (milestoneId === 'escrow') {
            dispatch({
                type: 'UPDATE_FINANCIALS',
                payload: { escrowState: 'funded' }
            });
        }
    };

    /**
     * Scan for Risk (Sentinel)
     */
    const assessRisk = (messageText) => {
        const check = scanForLeakage(messageText);
        if (check.detected) {
            dispatch({ type: 'SET_RISK_SCORE', payload: 75 }); // High risk
            return check.warning;
        }
        return null;
    };

    return (
        <TradeContext.Provider value={{ state, dispatch, initiateTrade, verifyMilestone, assessRisk, isOnline }}>
            {children}
        </TradeContext.Provider>
    );
}

// HOOK
export function useTradeContext() {
    const context = useContext(TradeContext);
    if (!context) {
        throw new Error('useTradeContext must be used within a TradeProvider');
    }
    return context;
}
