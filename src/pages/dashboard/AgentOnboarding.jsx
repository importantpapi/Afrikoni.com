import React from 'react';
import { motion } from 'framer-motion';
import { Surface } from '@/components/system/Surface';
import { Logo } from '@/components/shared/ui/Logo';
import { ArrowRight, Shield, Zap, Clock, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AgentOnboarding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-afrikoni-offwhite relative overflow-hidden flex flex-col">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-os-accent/5 rounded-full blur-[100px] animate-pulse delay-700" />

            <main className="flex-1 flex items-center justify-center p-6 z-10">
                <div className="max-w-2xl w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Surface variant="glass" className="p-10 border-white/[0.05] relative overflow-visible">
                            <div className="text-center space-y-8">
                                <div className="inline-flex p-4 bg-os-accent/10 border border-os-accent/20 rounded-os-lg mb-4 backdrop-blur-xl">
                                    <Logo type="symbol" size="md" />
                                </div>

                                <div className="space-y-3">
                                    <h1 className="text-4xl font-black uppercase tracking-[0.3em] text-os-text-primary leading-tight">
                                        Application <span className="text-os-accent">Under Review</span>
                                    </h1>
                                    <p className="text-os-sm text-os-text-secondary/60 max-w-md mx-auto leading-relaxed">
                                        Your account is being reviewed by the Afrikoni team. You will receive an email once approved — typically within <strong className="text-os-text-secondary">3–5 business days</strong>.
                                    </p>
                                </div>

                                {/* What happens next */}
                                <div className="text-left space-y-3">
                                    {[
                                        { icon: Shield, label: 'Identity check', desc: 'We verify your business registration and contact details.' },
                                        { icon: Zap, label: 'Account activation', desc: 'We enable your trade access and set up your profile.' },
                                        { icon: CheckCircle, label: 'You get notified', desc: 'You receive an email with your login link and next steps.' },
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-os-md bg-white/[0.03] border border-white/5">
                                            <div className="p-2 rounded-os-sm bg-os-accent/10 shrink-0">
                                                <step.icon className="w-4 h-4 text-os-accent" />
                                            </div>
                                            <div>
                                                <p className="text-os-xs font-black uppercase tracking-widest text-os-text-primary">{step.label}</p>
                                                <p className="text-os-xs text-os-text-secondary/50 mt-0.5">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t border-white/[0.05] space-y-4">
                                    <Button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full h-14 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.3em] text-os-xs rounded-os-md"
                                    >
                                        Go to Dashboard
                                        <ArrowRight className="ml-3 w-4 h-4" />
                                    </Button>
                                    <p className="text-os-xs text-os-text-secondary/40 flex items-center justify-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        Questions? Email us at{' '}
                                        <a href="mailto:support@afrikoni.com" className="text-os-accent underline ml-1">
                                            support@afrikoni.com
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </Surface>
                    </motion.div>

                    <footer className="mt-10 text-center text-os-text-secondary/20 text-os-xs font-black uppercase tracking-[0.4em]">
                        Afrikoni Trade Network &bull; Account Review
                    </footer>
                </div>
            </main>
        </div>
    );
}
