import React, { useState } from 'react';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import TradeDocument from '@/components/documents/TradeDocument';
import { Surface } from "@/components/system/Surface";
import { Button } from "@/components/shared/ui/button";
import { Download, Share2, Plus, Lock, CreditCard, Sparkles, FileSearch, Zap, Fingerprint } from 'lucide-react';
import { checkDocumentAccess } from '@/services/revenueEngine';
import KoniAIService from '@/services/KoniAIService';
import { toast } from 'sonner';

export default function DocumentsPage() {
    const { isSystemReady } = useDashboardKernel();

    if (!isSystemReady) {
        return <div className="os-page flex items-center justify-center min-h-[400px]">Loading...</div>;
    }
    const [activeDoc, setActiveDoc] = useState('invoice');
    const [docData, setDocData] = useState({});
    const [generated, setGenerated] = useState(false);

    const [isExtracting, setIsExtracting] = useState(false);

    // AI DNA Extractor Protocol v2.0 (Gemini 3 Upgrade) 
    const handleAutoFill = async (imageData = null) => {
        setIsExtracting(true);
        setDocData({});

        try {
            toast.info('Engaging Gemini 3 DNA Extractor...', { icon: <Sparkles className="w-4 h-4 text-os-accent" /> });

            const extracted = await KoniAIService.extractDNA({
                documentType: activeDoc,
                imageData, // Supports multimodal OCR if provided
                context: {
                    origin: 'DocumentsDashboard',
                    timestamp: new Date().toISOString()
                }
            });

            setDocData({
                ...extracted,
                source: "Sovereign DNA Extractor (Gemini 3 Flash)"
            });
            setGenerated(true);
            toast.success('Document DNA extracted & parsed');
        } catch (error) {
            console.error('DNA Extraction error:', error);
            toast.error('DNA Extraction failed. Reverting to manual entry.');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="os-page os-stagger space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="os-label">Infrastructure</div>
                    <h1 className="os-title mt-2">Trade Documentation</h1>
                    <p className="text-os-sm text-os-muted">Generated, watermarked, & verified trade assets.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
                    <Button className="shadow-gold gap-2"><Plus className="w-4 h-4" /> New Document</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Document Sidebar */}
                <div className="space-y-4">
                    <Surface variant="glass" className="p-4 space-y-2">
                        <h3 className="text-os-xs font-bold text-white uppercase tracking-wider mb-4 opacity-50">Available Templates</h3>
                        {['Commercial Invoice', 'Bill of Lading', 'Certificate of Origin', 'Packing List'].map(doc => {
                            // REVENUE ENGINE: Check document access entitlement
                            const access = checkDocumentAccess(doc, false); // Assuming no pack for demo
                            return (
                                <div
                                    key={doc}
                                    className={`p-3 rounded-lg text-os-sm font-medium cursor-pointer transition-colors flex justify-between items-center ${activeDoc === doc
                                        ? 'bg-koni-gold text-black'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                    onClick={() => { setActiveDoc(doc); setGenerated(false); setDocData({}); }}
                                >
                                    <span>{doc}</span>
                                    {access.locked && (
                                        <Lock className="w-3 h-3 opacity-50" />
                                    )}
                                </div>
                            )
                        })}
                    </Surface>

                    {generated && (
                        <Surface variant="panel" className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Ready for Export</h4>
                                <p className="text-os-xs text-os-muted mt-1">Verified by Trade Kernel</p>
                            </div>
                            <Button className="w-full">Download PDF</Button>
                        </Surface>
                    )}
                </div>

                {/* Document Preview (Digital Twin) */}
                <div className="lg:col-span-2">
                    <div className="origin-top transform scale-[0.95] lg:scale-100">
                        {generated && !checkDocumentAccess(activeDoc, false).locked ? (
                            <TradeDocument
                                type={activeDoc === 'invoice' ? 'Commercial Invoice' : activeDoc}
                                status={generated ? 'verified' : 'draft'}
                                data={docData}
                                onAutoFill={handleAutoFill}
                            />
                        ) : generated && checkDocumentAccess(activeDoc, false).locked ? (
                            <div className="relative">
                                <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center rounded-os-sm border border-white/10">
                                    <Lock className="w-12 h-12 text-amber-400 mb-4" />
                                    <h3 className="text-os-2xl font-bold text-white mb-2">Sovereign Validation Required</h3>
                                    <p className="text-os-muted mb-6 max-w-md">
                                        This document ({activeDoc}) requires the <strong>AfCFTA One-Flow Pack</strong> to generate a government-recognized certificate.
                                    </p>
                                    <Button className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-black font-bold border-none shadow-os-md shadow-amber-500/20">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Purchase One-Flow Pack ($25.00)
                                    </Button>
                                    <p className="text-os-xs text-white/30 mt-4">Includes 5 Stamps + Digital Notary</p>
                                </div>
                                <div className="filter blur-sm pointer-events-none opacity-50">
                                    <TradeDocument
                                        type={activeDoc === 'invoice' ? 'Commercial Invoice' : activeDoc}
                                        status="draft"
                                        data={docData}
                                        onAutoFill={() => { }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <TradeDocument
                                type={activeDoc === 'invoice' ? 'Commercial Invoice' : activeDoc}
                                status="draft"
                                data={docData}
                                onAutoFill={handleAutoFill}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
