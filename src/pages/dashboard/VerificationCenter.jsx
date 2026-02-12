import React from 'react';
import { Surface } from '@/components/system/Surface';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { ShieldCheck, CheckCircle2, Award, Shield, ArrowRight, UserCheck } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Progress } from "@/components/shared/ui/progress";

export default function VerificationCenter() {
    const { profile, organization } = useDashboardKernel();

    const steps = [
        { title: 'Sovereign Identity', status: 'verified', icon: UserCheck, desc: 'Digital ID and biometric verification complete.' },
        { title: 'Corporate Registry', status: 'verified', icon: ShieldCheck, desc: 'Business licensing and tax compliance verified.' },
        { title: 'Financial Solvency', status: 'verified', icon: Shield, desc: 'Capital requirements and credit history audited.' },
        { title: 'Trade Compliance', status: 'pending', icon: CheckCircle2, desc: 'AfCFTA Rules of Origin training in progress.' }
    ];

    return (
        <div className="os-page os-stagger space-y-6 max-w-5xl mx-auto">
            <Surface variant="glass" className="p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="w-64 h-64 text-afrikoni-gold" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Award className="w-8 h-8 text-afrikoni-gold" />
                        <h1 className="text-3xl font-bold">Verification Center</h1>
                    </div>
                    <p className="text-os-muted max-w-2xl text-lg mb-8">
                        The Afrikoni Verification Center ensures the highest standards of trust in the pan-African trade ecosystem.
                        Complete your profile to earn the <span className="text-afrikoni-gold font-bold">Verified Afrikoni Badge</span>.
                    </p>

                    <div className="flex items-center gap-6 p-6 bg-afrikoni-gold/10 rounded-2xl border border-afrikoni-gold/20">
                        <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold uppercase tracking-widest text-afrikoni-gold">Verification Progress</span>
                                <span className="font-mono text-xl font-bold">75%</span>
                            </div>
                            <Progress value={75} className="h-3 bg-white/5 border border-white/10" />
                        </div>
                    </div>
                </div>
            </Surface>

            <div className="grid md:grid-cols-2 gap-6">
                {steps.map((step, i) => (
                    <Surface key={i} variant="panel" className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${step.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <step.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg">{step.title}</h3>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${step.status === 'verified' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                        {step.status}
                                    </span>
                                </div>
                                <p className="text-sm text-os-muted mb-4">{step.desc}</p>
                                {step.status !== 'verified' && (
                                    <Button variant="outline" size="sm" className="w-full gap-2 border-afrikoni-gold/50 text-afrikoni-gold">
                                        Complete Now <ArrowRight className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Surface>
                ))}
            </div>

            <Surface variant="glass" className="p-8 text-center bg-gradient-to-b from-afrikoni-gold/5 to-transparent">
                <Award className="w-16 h-16 text-afrikoni-gold mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">The Afrikoni Badge</h2>
                <p className="text-os-muted max-w-md mx-auto mb-6">
                    Verified members gain access to lower escrow fees, premium logistical support, and a high-trust visibility rating across the network.
                </p>
                <Button className="bg-afrikoni-gold text-black font-bold px-8 py-3 rounded-xl shadow-lg border-2 border-afrikoni-gold/50 hover:scale-105 transition-transform">
                    Apply For Badge
                </Button>
            </Surface>
        </div>
    );
}
