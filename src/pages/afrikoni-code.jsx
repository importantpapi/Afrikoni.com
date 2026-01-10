import React from 'react';
import { motion } from 'framer-motion';
import BushidoManifesto from '@/components/home/BushidoManifesto';
import SEO from '@/components/SEO';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

export default function AfrikoniCode() {
  return (
    <>
      <SEO 
        title="The Afrikoni Code - Our Guiding Principles"
        description="The internal principles guiding how Afrikoni is built and operated. This is not marketing. This is a commitment."
        url="/afrikoni-code"
        ogType="website"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Header Section */}
        <section className="relative bg-gradient-to-br from-afrikoni-chestnut via-afrikoni-deep to-afrikoni-chestnut py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <Link to="/about">
                <Button 
                  variant="ghost" 
                  className="text-afrikoni-cream hover:text-afrikoni-gold hover:bg-afrikoni-gold/10 mb-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to About
                </Button>
              </Link>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-gold mb-6">
                The Afrikoni Code
              </h1>
              
              <div className="max-w-3xl mx-auto">
                <Card className="border-2 border-afrikoni-gold/30 bg-afrikoni-deep/80 backdrop-blur-sm">
                  <CardContent className="p-6 md:p-8">
                    <p className="text-lg md:text-xl text-afrikoni-cream leading-relaxed mb-4">
                      This code reflects the internal principles guiding how Afrikoni is built and operated.
                    </p>
                    <p className="text-base md:text-lg text-afrikoni-cream/90 font-semibold">
                      It is not marketing. It is a commitment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bushido Manifesto */}
        <BushidoManifesto />
      </div>
    </>
  );
}

