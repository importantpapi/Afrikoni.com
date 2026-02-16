import React from 'react';
import { Card } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { ShoppingCart, Package, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function OnboardingWizard() {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-16"
            >
                <div className="w-20 h-20 bg-os-accent/10 rounded-os-lg flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-os-accent" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-4">
                    Welcome to Afrikoni! 👋
                </h1>
                <p className="text-os-xl text-os-text-secondary max-w-2xl mx-auto">
                    You're 60 seconds away from your first continental trade. What would you like to do first?
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* BUYER PATH */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card
                        className="p-8 h-full flex flex-col items-center text-center hover:border-os-accent/50 transition-all cursor-pointer group border-2 border-transparent bg-white/5 backdrop-blur-xl"
                        onClick={() => navigate('/dashboard/rfqs/new')}
                    >
                        <div className="w-16 h-16 bg-os-blue/10 rounded-os-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-8 h-8 text-os-blue" />
                        </div>
                        <h3 className="text-os-2xl font-bold mb-3">I Want to Buy</h3>
                        <p className="text-os-text-secondary mb-8 flex-grow">
                            Tell us what you need in plain language. We'll match you with verified suppliers across Africa.
                        </p>
                        <Button size="lg" className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-os-sm font-bold">
                            Post Buying Request →
                        </Button>
                    </Card>
                </motion.div>

                {/* SELLER PATH */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card
                        className="p-8 h-full flex flex-col items-center text-center hover:border-os-accent/50 transition-all cursor-pointer group border-2 border-transparent bg-white/5 backdrop-blur-xl"
                        onClick={() => navigate('/dashboard/products/new')}
                    >
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-os-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Package className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-os-2xl font-bold mb-3">I Want to Sell</h3>
                        <p className="text-os-text-secondary mb-8 flex-grow">
                            List your products and gain visibility to thousands of institutional buyers.
                        </p>
                        <Button size="lg" className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-os-sm font-bold">
                            List My Products →
                        </Button>
                    </Card>
                </motion.div>
            </div>

            {/* GUEST MODE LINK */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center mt-12"
            >
                <button
                    onClick={() => navigate('/marketplace')}
                    className="text-os-text-secondary hover:text-white transition-colors flex items-center gap-2 mx-auto"
                >
                    <Search className="w-4 h-4" />
                    Just browsing? Explore the marketplace →
                </button>
            </motion.div>
        </div>
    );
}
