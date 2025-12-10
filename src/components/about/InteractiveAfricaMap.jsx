import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// List of all 54 African countries
const AFRICAN_COUNTRIES = [
  { name: 'Algeria', code: 'DZ', region: 'North Africa' },
  { name: 'Angola', code: 'AO', region: 'Central Africa' },
  { name: 'Benin', code: 'BJ', region: 'West Africa' },
  { name: 'Botswana', code: 'BW', region: 'Southern Africa' },
  { name: 'Burkina Faso', code: 'BF', region: 'West Africa' },
  { name: 'Burundi', code: 'BI', region: 'East Africa' },
  { name: 'Cabo Verde', code: 'CV', region: 'West Africa' },
  { name: 'Cameroon', code: 'CM', region: 'Central Africa' },
  { name: 'Central African Republic', code: 'CF', region: 'Central Africa' },
  { name: 'Chad', code: 'TD', region: 'Central Africa' },
  { name: 'Comoros', code: 'KM', region: 'East Africa' },
  { name: 'Congo', code: 'CG', region: 'Central Africa' },
  { name: 'Côte d\'Ivoire', code: 'CI', region: 'West Africa' },
  { name: 'Democratic Republic of the Congo', code: 'CD', region: 'Central Africa' },
  { name: 'Djibouti', code: 'DJ', region: 'East Africa' },
  { name: 'Egypt', code: 'EG', region: 'North Africa' },
  { name: 'Equatorial Guinea', code: 'GQ', region: 'Central Africa' },
  { name: 'Eritrea', code: 'ER', region: 'East Africa' },
  { name: 'Eswatini', code: 'SZ', region: 'Southern Africa' },
  { name: 'Ethiopia', code: 'ET', region: 'East Africa' },
  { name: 'Gabon', code: 'GA', region: 'Central Africa' },
  { name: 'Gambia', code: 'GM', region: 'West Africa' },
  { name: 'Ghana', code: 'GH', region: 'West Africa' },
  { name: 'Guinea', code: 'GN', region: 'West Africa' },
  { name: 'Guinea-Bissau', code: 'GW', region: 'West Africa' },
  { name: 'Kenya', code: 'KE', region: 'East Africa' },
  { name: 'Lesotho', code: 'LS', region: 'Southern Africa' },
  { name: 'Liberia', code: 'LR', region: 'West Africa' },
  { name: 'Libya', code: 'LY', region: 'North Africa' },
  { name: 'Madagascar', code: 'MG', region: 'East Africa' },
  { name: 'Malawi', code: 'MW', region: 'East Africa' },
  { name: 'Mali', code: 'ML', region: 'West Africa' },
  { name: 'Mauritania', code: 'MR', region: 'West Africa' },
  { name: 'Mauritius', code: 'MU', region: 'East Africa' },
  { name: 'Morocco', code: 'MA', region: 'North Africa' },
  { name: 'Mozambique', code: 'MZ', region: 'Southern Africa' },
  { name: 'Namibia', code: 'NA', region: 'Southern Africa' },
  { name: 'Niger', code: 'NE', region: 'West Africa' },
  { name: 'Nigeria', code: 'NG', region: 'West Africa' },
  { name: 'Rwanda', code: 'RW', region: 'East Africa' },
  { name: 'São Tomé and Príncipe', code: 'ST', region: 'Central Africa' },
  { name: 'Senegal', code: 'SN', region: 'West Africa' },
  { name: 'Seychelles', code: 'SC', region: 'East Africa' },
  { name: 'Sierra Leone', code: 'SL', region: 'West Africa' },
  { name: 'Somalia', code: 'SO', region: 'East Africa' },
  { name: 'South Africa', code: 'ZA', region: 'Southern Africa' },
  { name: 'South Sudan', code: 'SS', region: 'East Africa' },
  { name: 'Sudan', code: 'SD', region: 'North Africa' },
  { name: 'Tanzania', code: 'TZ', region: 'East Africa' },
  { name: 'Togo', code: 'TG', region: 'West Africa' },
  { name: 'Tunisia', code: 'TN', region: 'North Africa' },
  { name: 'Uganda', code: 'UG', region: 'East Africa' },
  { name: 'Zambia', code: 'ZM', region: 'Southern Africa' },
  { name: 'Zimbabwe', code: 'ZW', region: 'Southern Africa' }
];

const REGIONS = {
  'North Africa': 'bg-blue-100 text-blue-800 border-blue-300',
  'West Africa': 'bg-green-100 text-green-800 border-green-300',
  'East Africa': 'bg-purple-100 text-purple-800 border-purple-300',
  'Central Africa': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Southern Africa': 'bg-red-100 text-red-800 border-red-300'
};

const REGION_POSITIONS = {
  'North Africa': { baseX: 450, baseY: 200, spread: 150 },
  'West Africa': { baseX: 300, baseY: 375, spread: 100 },
  'Central Africa': { baseX: 450, baseY: 400, spread: 80 },
  'East Africa': { baseX: 650, baseY: 400, spread: 100 },
  'Southern Africa': { baseX: 400, baseY: 550, spread: 120 }
};

const REGION_COLORS = {
  'North Africa': '#3B82F6',
  'West Africa': '#10B981',
  'Central Africa': '#FBBF24',
  'East Africa': '#8B5CF6',
  'Southern Africa': '#EF4444'
};

export default function InteractiveAfricaMap() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');

  const regions = ['All', ...new Set(AFRICAN_COUNTRIES.map(c => c.region))];
  
  const filteredCountries = AFRICAN_COUNTRIES.filter(country => {
    const matchesSearch = country.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || country.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-afrikoni-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-afrikoni-gold bg-white"
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-2 border border-afrikoni-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-afrikoni-gold bg-white"
        >
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Map Visualization */}
      <Card className="border-afrikoni-gold/20 shadow-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="relative bg-gradient-to-br from-afrikoni-gold/10 via-afrikoni-cream/5 to-afrikoni-chestnut/10 rounded-lg p-8">
            {/* Simplified Africa Continent SVG with better visibility */}
            <div className="aspect-video relative overflow-visible">
              <svg
                viewBox="0 0 1000 800"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Simplified Africa continent outline - more visible */}
                <path
                  d="M 150 100 L 200 120 L 280 140 L 360 150 L 440 160 L 520 170 L 600 180 L 680 200 L 750 240 L 780 300 L 760 360 L 720 420 L 660 480 L 580 520 L 500 540 L 420 550 L 340 560 L 260 570 L 180 580 L 100 570 L 60 520 L 80 460 L 100 400 L 120 340 L 130 280 L 140 220 L 150 100 Z"
                  fill="#D4A937"
                  fillOpacity="0.15"
                  stroke="#D4A937"
                  strokeWidth="4"
                  className="opacity-60"
                />
                
                {/* Regional sections with different colors */}
                <g opacity="0.3">
                  {/* North Africa */}
                  <path
                    d="M 150 100 L 200 120 L 280 140 L 360 150 L 440 160 L 520 170 L 600 180 L 680 200 L 750 240 L 780 300 L 760 300 L 720 300 L 600 300 L 500 300 L 400 300 L 300 300 L 200 300 L 150 300 L 140 220 L 150 100 Z"
                    fill="#3B82F6"
                    fillOpacity="0.2"
                  />
                  {/* West Africa */}
                  <path
                    d="M 200 300 L 300 300 L 400 300 L 500 300 L 600 300 L 650 350 L 600 400 L 500 450 L 400 450 L 300 450 L 200 400 L 200 300 Z"
                    fill="#10B981"
                    fillOpacity="0.2"
                  />
                  {/* Central Africa */}
                  <path
                    d="M 400 300 L 500 300 L 600 300 L 650 350 L 600 400 L 500 450 L 400 450 L 300 450 L 300 500 L 400 500 L 500 500 L 400 500 L 300 500 L 300 450 Z"
                    fill="#FBBF24"
                    fillOpacity="0.2"
                  />
                  {/* East Africa */}
                  <path
                    d="M 600 300 L 720 300 L 760 300 L 720 360 L 660 420 L 580 480 L 500 520 L 400 500 L 500 500 L 580 480 L 600 400 L 600 300 Z"
                    fill="#8B5CF6"
                    fillOpacity="0.2"
                  />
                  {/* Southern Africa */}
                  <path
                    d="M 300 500 L 400 500 L 500 520 L 420 550 L 340 560 L 260 570 L 180 580 L 100 570 L 60 520 L 80 460 L 200 450 L 300 500 Z"
                    fill="#EF4444"
                    fillOpacity="0.2"
                  />
                </g>
                
                {/* Country markers as larger, more visible dots */}
                {filteredCountries.map((country, index) => {
                  // Better positioning based on region
                  let cx, cy;
                  
                  const pos = REGION_POSITIONS[country.region] || { baseX: 500, baseY: 400, spread: 200 };
                  const regionCountries = filteredCountries.filter(c => c.region === country.region);
                  const regionIndex = regionCountries.findIndex(c => c.code === country.code);
                  const angle = (regionIndex / Math.max(regionCountries.length, 1)) * 2 * Math.PI;
                  
                  cx = pos.baseX + (pos.spread * 0.4) * Math.cos(angle);
                  cy = pos.baseY + (pos.spread * 0.4) * Math.sin(angle);
                  
                  const isSelected = selectedCountry?.code === country.code;
                  
                  return (
                    <g key={country.code}>
                      {/* Hover area - larger invisible circle for easier clicking */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 20 : 15}
                        fill="transparent"
                        className="cursor-pointer"
                        onClick={() => setSelectedCountry(country)}
                        onMouseEnter={() => {}}
                      />
                      {/* Visible country marker */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 12 : 8}
                        fill={isSelected ? '#D4A937' : (REGION_COLORS[country.region] || '#D4A937')}
                        stroke={isSelected ? '#8B4513' : '#fff'}
                        strokeWidth={isSelected ? 3 : 2}
                        className="cursor-pointer transition-all"
                        onClick={() => setSelectedCountry(country)}
                        style={{ 
                          opacity: isSelected ? 1 : 0.8,
                          filter: isSelected ? 'drop-shadow(0 0 8px rgba(212, 169, 55, 0.6))' : 'none'
                        }}
                      />
                      {/* Country code label */}
                      {isSelected && (
                        <g>
                          <rect
                            x={cx - 25}
                            y={cy - 35}
                            width={50}
                            height={20}
                            fill="#8B4513"
                            fillOpacity="0.9"
                            rx="4"
                          />
                          <text
                            x={cx}
                            y={cy - 20}
                            textAnchor="middle"
                            className="fill-white font-bold text-xs"
                          >
                            {country.code}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
                
                {/* Legend */}
                <g transform="translate(50, 700)">
                  <text x="0" y="0" className="fill-afrikoni-chestnut font-semibold text-sm">Regions:</text>
                  {Object.entries(REGION_COLORS).map(([region, color], idx) => (
                    <g key={region} transform={`translate(${idx * 120}, 20)`}>
                      <circle cx="0" cy="0" r="6" fill={color} />
                      <text x="12" y="4" className="fill-afrikoni-deep text-xs">{region}</text>
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            
            {/* Info overlay */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-afrikoni-gold/20">
              <div className="text-xs text-afrikoni-deep">
                <div className="font-semibold mb-1">Click countries to explore</div>
                <div className="text-afrikoni-deep/70">
                  {filteredCountries.length} of {AFRICAN_COUNTRIES.length} countries shown
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Countries Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredCountries.map((country) => (
          <motion.div
            key={country.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCountry(country)}
            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
              selectedCountry?.code === country.code
                ? 'border-afrikoni-gold bg-afrikoni-gold/10 shadow-lg'
                : 'border-afrikoni-gold/20 bg-white hover:border-afrikoni-gold/40 hover:bg-afrikoni-gold/5'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-afrikoni-gold" />
              <span className="text-xs font-semibold text-afrikoni-chestnut">
                {country.code}
              </span>
            </div>
            <p className="text-sm font-medium text-afrikoni-deep mb-1 line-clamp-2">
              {country.name}
            </p>
            <Badge 
              variant="outline" 
              className={`text-xs ${REGIONS[country.region] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
            >
              {country.region}
            </Badge>
          </motion.div>
        ))}
      </div>

      {/* Selected Country Info */}
      {selectedCountry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Card className="border-afrikoni-gold/30 bg-gradient-to-br from-afrikoni-gold/5 to-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-afrikoni-chestnut mb-2">
                    {selectedCountry.name}
                  </h3>
                  <div className="flex items-center gap-4">
                    <Badge className={REGIONS[selectedCountry.region] || 'bg-gray-100 text-gray-800'}>
                      {selectedCountry.region}
                    </Badge>
                    <span className="text-sm text-afrikoni-deep/70">
                      Country Code: {selectedCountry.code}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCountry(null)}
                  className="text-afrikoni-deep/50 hover:text-afrikoni-deep"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm text-afrikoni-deep/80">
                <p className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-afrikoni-gold" />
                  <span>We provide B2B marketplace services in {selectedCountry.name}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-afrikoni-gold" />
                  <span>Connect with verified suppliers and buyers across {selectedCountry.region}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-afrikoni-gold mb-1">
              {AFRICAN_COUNTRIES.length}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Total Countries</div>
          </CardContent>
        </Card>
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-afrikoni-gold mb-1">
              {regions.length - 1}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Regions</div>
          </CardContent>
        </Card>
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-afrikoni-gold mb-1">
              {filteredCountries.length}
            </div>
            <div className="text-sm text-afrikoni-deep/70">Showing</div>
          </CardContent>
        </Card>
        <Card className="border-afrikoni-gold/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-afrikoni-gold mb-1">
              100%
            </div>
            <div className="text-sm text-afrikoni-deep/70">Coverage</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

