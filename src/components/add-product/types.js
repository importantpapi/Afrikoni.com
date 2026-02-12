export const initialProductFormData = {
  name: '',
  category: '',
  subcategory: '',
  description: '',
  images: [],
  imageUrls: [],
  videoUrl: '',
  price: '',
  currency: 'USD',
  unit: 'kg',
  moq: '',
  maxQuantity: '',
  availability: 'in_stock',
  deliveryRegions: [],
  leadTime: '',
  isDraft: false,
};

export const CATEGORIES = [
  { value: 'agricultural', label: 'Agricultural Products', icon: '🌾' },
  { value: 'minerals', label: 'Minerals & Mining', icon: '⛏️' },
  { value: 'textiles', label: 'Textiles & Fashion', icon: '👔' },
  { value: 'food-beverage', label: 'Food & Beverages', icon: '🍫' },
  { value: 'crafts', label: 'Crafts & Artisan', icon: '🎨' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'chemicals', label: 'Chemicals & Plastics', icon: '🧪' },
  { value: 'machinery', label: 'Machinery & Equipment', icon: '⚙️' },
];

export const SUBCATEGORIES = {
  agricultural: [
    { value: 'cocoa', label: 'Cocoa & Chocolate' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'cashews', label: 'Cashews & Nuts' },
    { value: 'shea', label: 'Shea Butter' },
    { value: 'spices', label: 'Spices' },
    { value: 'fruits', label: 'Fresh Fruits' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'grains', label: 'Grains & Cereals' },
  ],
  minerals: [
    { value: 'gold', label: 'Gold' },
    { value: 'diamond', label: 'Diamonds' },
    { value: 'copper', label: 'Copper' },
    { value: 'iron', label: 'Iron Ore' },
    { value: 'manganese', label: 'Manganese' },
  ],
  textiles: [
    { value: 'kente', label: 'Kente Cloth' },
    { value: 'ankara', label: 'Ankara/Wax Print' },
    { value: 'cotton', label: 'Cotton Fabrics' },
    { value: 'leather', label: 'Leather Goods' },
  ],
  'food-beverage': [
    { value: 'palm_oil', label: 'Palm Oil' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'processed', label: 'Processed Foods' },
    { value: 'snacks', label: 'Snacks' },
  ],
  crafts: [
    { value: 'woodwork', label: 'Woodwork' },
    { value: 'beads', label: 'Beads & Jewelry' },
    { value: 'baskets', label: 'Baskets & Weaving' },
    { value: 'pottery', label: 'Pottery' },
  ],
  electronics: [
    { value: 'solar', label: 'Solar Equipment' },
    { value: 'phones', label: 'Mobile Devices' },
    { value: 'accessories', label: 'Accessories' },
  ],
  chemicals: [
    { value: 'industrial', label: 'Industrial Chemicals' },
    { value: 'plastics', label: 'Plastics' },
    { value: 'packaging', label: 'Packaging Materials' },
  ],
  machinery: [
    { value: 'agricultural', label: 'Agricultural Machinery' },
    { value: 'processing', label: 'Processing Equipment' },
    { value: 'construction', label: 'Construction Equipment' },
  ],
};

export const UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'tons', label: 'Metric Tons' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'liters', label: 'Liters' },
  { value: 'bags', label: 'Bags' },
  { value: 'cartons', label: 'Cartons' },
  { value: 'containers', label: '20ft Containers' },
];

export const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'NGN', label: 'NGN (₦)', symbol: '₦' },
  { value: 'GHS', label: 'GHS (₵)', symbol: '₵' },
  { value: 'KES', label: 'KES (KSh)', symbol: 'KSh' },
  { value: 'ZAR', label: 'ZAR (R)', symbol: 'R' },
];

export const DELIVERY_REGIONS = [
  { value: 'west_africa', label: 'West Africa' },
  { value: 'east_africa', label: 'East Africa' },
  { value: 'central_africa', label: 'Central Africa' },
  { value: 'southern_africa', label: 'Southern Africa' },
  { value: 'north_africa', label: 'North Africa' },
  { value: 'europe', label: 'Europe' },
  { value: 'north_america', label: 'North America' },
  { value: 'asia', label: 'Asia' },
  { value: 'global', label: 'Worldwide' },
];

export const MOQ_SUGGESTIONS = {
  agricultural: ['100 kg', '500 kg', '1 ton', '5 tons', '20 tons'],
  minerals: ['10 kg', '50 kg', '100 kg', '1 ton'],
  textiles: ['50 pieces', '100 pieces', '500 pieces', '1000 pieces'],
  'food-beverage': ['100 cartons', '500 cartons', '1 container'],
  crafts: ['10 pieces', '50 pieces', '100 pieces'],
  electronics: ['100 pieces', '500 pieces', '1000 pieces'],
  chemicals: ['500 kg', '1 ton', '5 tons'],
  machinery: ['1 piece', '5 pieces', '10 pieces'],
};
