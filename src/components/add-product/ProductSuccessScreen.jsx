import { useEffect, useState } from 'react';
import { CheckCircle2, Share2, Plus, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

function Confetti() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#C4963C', '#2E7D32', '#1976D2', '#E91E63', '#FF9800'];
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: '-10px',
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default function ProductSuccessScreen({ formData, onAddAnother, onViewProducts }) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      {showConfetti && <Confetti />}

      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-lg animate-bounce">
          🎉
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[var(--os-text-primary)] mb-2">Product Published!</h1>
      <p className="text-[var(--os-text-secondary)] max-w-md mb-2">
        Your product "{formData.name}" is now live on Afrikoni and visible to international buyers.
      </p>

      <div className="bg-white/5 rounded-lg px-4 py-3 mb-8 max-w-md border border-white/10">
        <p className="text-sm text-[var(--os-text-primary)]">
          ✨ <strong>Pro tip:</strong> Listings with complete profiles get 5x more inquiries.
        </p>
      </div>

      {formData.imageUrls.length > 0 && (
        <div className="mb-8">
          <div className="relative">
            <img
              src={formData.imageUrls[0]}
              alt={formData.name}
              className="w-32 h-32 rounded-xl object-cover shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
            />
            <div className="absolute -bottom-2 -right-2 bg-white text-black text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Live
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3 mb-8">
        <p className="text-sm font-medium text-[var(--os-text-secondary)]">What's next?</p>

        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 text-left border border-white/10">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--os-text-primary)]">Buyers can now find you</p>
              <p className="text-xs text-[var(--os-text-secondary)]">Your product appears in search results</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 text-left border border-white/10">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--os-text-primary)]">Share your listing</p>
              <p className="text-xs text-[var(--os-text-secondary)]">Send to potential buyers directly</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button onClick={onAddAnother} className="flex-1 bg-white text-black h-12">
          <Plus className="w-4 h-4 mr-2" />
          Add Another Product
        </Button>

        <Button variant="outline" onClick={onViewProducts} className="flex-1 h-12 border-white/20">
          View My Products
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
