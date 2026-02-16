import React from 'react';
import { motion } from 'framer-motion';
import { Surface } from '@/components/system/Surface';
import { Logo } from '@/components/shared/ui/Logo';
import { ArrowRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AgentOnboarding() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-afrikoni-offwhite relative overflow-hidden flex flex-col">
            {/* 🎬 CINEMATIC DEPTH */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-os-accent/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D4A937]/5 rounded-full blur-[100px] animate-pulse delay-700" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <main className="flex-1 flex items-center justify-center p-6 z-10">
                <div className="max-w-2xl w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Surface variant="glass" className="p-12 border-white/[0.05] relative overflow-visible">
                            {/* Corner Accents */}
                            <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-l from-os-accent to-transparent" />
                            <div className="absolute bottom-0 left-0 w-[1px] h-24 bg-gradient-to-t from-os-accent to-transparent" />

                            <div className="text-center space-y-10">
                                <div className="inline-flex p-4 bg-os-accent/10 border border-os-accent/20 rounded-os-lg mb-4 backdrop-blur-xl">
                                    <Logo type="symbol" size="md" />
                                </div>

                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black uppercase tracking-[0.4em] text-os-text-primary leading-tight">
                                        Agent <span className="text-os-accent">Initialization</span>
                                    </h1>
                                    <p className="text-os-xs font-bold text-os-text-secondary/40 uppercase tracking-[0.3em] max-w-md mx-auto leading-loose">
                                        Your node is pending verification by the Afrikoni Network Authority. Secure handshake in progress.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                    <Surface variant="panel" className="p-6 border-white/5 space-y-4">
                                        <Shield className="w-5 h-5 text-os-accent" />
                                        <div className="space-y-1">
                                            <h3 className="text-os-xs font-black uppercase tracking-widest text-os-text-primary">Identity Bond</h3>
                                            <p className="text-os-xs text-os-text-secondary/40 uppercase tracking-tighter leading-relaxed">Verification of sovereign credentials and domain expertise.</p>
                                        </div>
                                    </Surface>

                                    <Surface variant="panel" className="p-6 border-white/5 space-y-4">
                                        <Zap className="w-5 h-5 text-os-accent" />
                                        <div className="space-y-1">
                                            <h3 className="text-os-xs font-black uppercase tracking-widest text-os-text-primary">Protocol Access</h3>
                                            <p className="text-os-xs text-os-text-secondary/40 uppercase tracking-tighter leading-relaxed">Initialization of trade matching and settlement protocols.</p>
                                        </div>
                                    </Surface>
                                </div>

                                <div className="pt-8 border-t border-white/[0.05]">
                                    <Button
                                        onClick={() => navigate('/dashboard')}
                                        className="h-16 px-12 bg-os-accent hover:bg-os-accent/90 text-black font-black uppercase tracking-[0.4em] text-os-xs rounded-os-md shadow-glow transition-all active:scale-95"
                                    >
                                        Enter Mission Control
                                        <ArrowRight className="ml-3 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Surface>
                    </motion.div>

                    <footer className="mt-12 text-center text-os-text-secondary/10 text-os-xs font-black uppercase tracking-[0.5em] animate-pulse">
                        Afrikoni Autonomous Network &bull; Agent Genesis Signal
                    </footer>
                </div>
            </main>
        </div>
    );
}
