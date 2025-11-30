import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Country flag emojis
const countryFlags = {
  'Nigeria': '🇳🇬',
  'Egypt': '🇪🇬',
  'Ghana': '🇬🇭',
  'Senegal': '🇸🇳'
};

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Ayo Okonkwo',
      role: 'Import Manager',
      company: 'West Africa Trading Co.',
      location: 'Lagos, Nigeria',
      country: 'Nigeria',
      text: 'Afrikoni helped me find reliable cocoa suppliers in Ghana. The verification process gave me confidence, and now I have a steady supply chain that\'s boosted our business by 40%.',
      rating: 5,
      initials: 'AO',
      avatar: 'https://ui-avatars.com/api/?name=Ayo+Okonkwo&background=orange&color=fff&size=128'
    },
    {
      name: 'Fatima Al-Rashid',
      role: 'Procurement Director',
      company: 'Nile Commerce',
      location: 'Cairo, Egypt',
      country: 'Egypt',
      text: 'The AI-powered matching system connected us with the perfect textile suppliers in Ethiopia. The quality is exceptional and the prices are very competitive.',
      rating: 5,
      initials: 'FA',
      avatar: 'https://ui-avatars.com/api/?name=Fatima+Al-Rashid&background=blue&color=fff&size=128'
    },
    {
      name: 'Kwame Asante',
      role: 'Export Manager',
      company: 'Golden Coast Exports',
      location: 'Accra, Ghana',
      country: 'Ghana',
      text: 'As a seller on Afrikoni, I\'ve expanded my reach across 15 African countries. The platform\'s tools help me manage orders efficiently and build trust with international buyers.',
      rating: 5,
      initials: 'KA',
      avatar: 'https://ui-avatars.com/api/?name=Kwame+Asante&background=green&color=fff&size=128'
    },
    {
      name: 'Amara Diallo',
      role: 'Business Owner',
      company: 'Sahel Organics',
      location: 'Dakar, Senegal',
      country: 'Senegal',
      text: 'Afrikoni\'s trade finance solutions made it possible for us to fulfill large orders. Their support team understands African business challenges and provides real solutions.',
      rating: 5,
      initials: 'AD',
      avatar: 'https://ui-avatars.com/api/?name=Amara+Diallo&background=purple&color=fff&size=128'
    }
  ];

  return (
    <div className="py-12 md:py-16 bg-afrikoni-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3 md:mb-4">
            Trusted by African Businesses
          </h2>
          <p className="text-base md:text-lg text-afrikoni-deep">
            Join thousands of successful traders who've grown their business with Afrikoni
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <motion.div
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-l-4 border-afrikoni-gold bg-afrikoni-offwhite hover:shadow-2xl transition-all rounded-xl">
                  <CardContent className="p-6 md:p-8 relative">
                    <div className="absolute top-4 left-4 text-5xl md:text-6xl font-bold text-afrikoni-gold opacity-10">
                      "
                    </div>
                    <div className="flex gap-1 mb-4 relative z-10">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-4 h-4 md:w-5 md:h-5 ${star <= testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-afrikoni-deep/50'}`} />
                      ))}
                    </div>
                    <p className="text-afrikoni-deep mb-5 md:mb-6 leading-relaxed relative z-10 text-sm md:text-base">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3 md:gap-4 relative z-10">
                      <div className="relative">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-afrikoni-gold/30 object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 text-xl md:text-2xl bg-afrikoni-offwhite rounded-full p-0.5 md:p-1">
                          {countryFlags[testimonial.country] || '🇦🇫'}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-afrikoni-chestnut text-base md:text-lg">{testimonial.name}</div>
                        <div className="text-xs md:text-sm text-afrikoni-deep">{testimonial.role}</div>
                        <div className="text-xs md:text-sm text-afrikoni-gold font-semibold">{testimonial.company}</div>
                        <div className="flex items-center gap-1 text-xs md:text-sm text-afrikoni-deep/70 mt-1">
                          <span>{countryFlags[testimonial.country]}</span>
                          <span>{testimonial.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
