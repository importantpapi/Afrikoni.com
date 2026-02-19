import React from 'react';
import { Dialog, DialogContent } from '@/components/shared/ui/dialog';
import { ShieldCheck, Lock, Landmark, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

export const PaymentProtectionModal = ({ isOpen, onClose, onProceed, amount, currency }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-none bg-os-surface-solid">
                <div className="bg-os-accent/5 p-8 border-b border-os-stroke/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck className="w-32 h-32 text-os-accent" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-os-accent flex items-center justify-center shadow-os-lg">
                            <Lock className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">Afrikoni Shield</h2>
                            <p className="text-os-xs font-black uppercase tracking-[0.2em] text-os-accent">Institutional Payment Protection</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-os-sm font-medium text-os-muted">
                        You are about to fund an escrow for <span className="text-foreground font-black">{currency} {amount.toLocaleString()}</span>.
                        Before you proceed, we want to ensure you understand how your funds are protected.
                    </p>

                    <div className="space-y-4">
                        <div className="flex gap-4 group">
                            <div className="shrink-0 w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <Landmark className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-os-sm font-black uppercase tracking-wider text-foreground">Escrow Isolation</h4>
                                <p className="text-os-xs text-os-muted leading-relaxed">Funds are held in a secure, audited escrow account. Suppliers cannot access these funds until you officially confirm delivery.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 group">
                            <div className="shrink-0 w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                <HeartHandshake className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-os-sm font-black uppercase tracking-wider text-foreground">Conflict Resolution</h4>
                                <p className="text-os-xs text-os-muted leading-relaxed">In case of any mismatch between the contract and the goods received, Afrikoni acts as a neutral arbitrator to protect your capital.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 group">
                            <div className="shrink-0 w-8 h-8 rounded bg-os-accent/10 border border-os-accent/20 flex items-center justify-center text-os-accent">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-os-sm font-black uppercase tracking-wider text-foreground">Verified Settlement</h4>
                                <p className="text-os-xs text-os-muted leading-relaxed">All transactions are logged in our Forensic Event Ledger, ensuring an immutable audit trail for institutional compliance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 font-black uppercase tracking-widest text-[10px]" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button className="flex-1 h-12 bg-os-accent hover:bg-os-accent-dark text-black font-black uppercase tracking-widest text-[10px]" onClick={onProceed}>
                            I Understand & Proceed
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
