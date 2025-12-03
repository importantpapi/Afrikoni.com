import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-afrikoni-offwhite flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="mb-8">
          <Logo type="full" size="lg" link={true} />
        </div>
        
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-afrikoni-gold mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-afrikoni-deep mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link to="/">
            <Button className="bg-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-goldLight px-6 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Go Home
            </Button>
          </Link>
          <Link to="/marketplace">
            <Button variant="outline" className="border-afrikoni-gold/70 text-afrikoni-chestnut hover:bg-afrikoni-gold/10 px-6 py-3 rounded-full font-semibold flex items-center gap-2">
              <Search className="w-5 h-5" />
              Browse Marketplace
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-afrikoni-deep hover:text-afrikoni-gold px-6 py-3 rounded-full font-semibold flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-afrikoni-gold/20">
          <p className="text-sm text-afrikoni-deep/70 mb-4">Popular Pages:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { to: '/marketplace', label: 'Marketplace' },
              { to: '/become-supplier', label: 'Become a Supplier' },
              { to: '/help', label: 'Help Center' },
              { to: '/contact', label: 'Contact Us' },
            ].map((link, idx) => (
              <Link
                key={idx}
                to={link.to}
                className="text-afrikoni-gold hover:text-afrikoni-goldLight text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

