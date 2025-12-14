/**
 * Product Category Intelligence
 * Automatically matches products to popular categories based on title and description
 */

// Popular categories mapping with keywords
const POPULAR_CATEGORIES = {
  'Agriculture & Food': {
    keywords: [
      'agriculture', 'agricultural', 'food', 'cocoa', 'cacao', 'coffee', 'tea', 'spices', 'herbs',
      'grains', 'rice', 'wheat', 'maize', 'corn', 'beans', 'nuts', 'seeds', 'fruits', 'vegetables',
      'farming', 'crop', 'produce', 'organic', 'raw', 'fresh', 'processed', 'cashew', 'shea',
      'palm', 'coconut', 'sesame', 'peanut', 'groundnut', 'yam', 'cassava', 'plantain', 'banana'
    ],
    categoryName: 'Agriculture & Food'
  },
  'Textiles & Apparel': {
    keywords: [
      'textile', 'textiles', 'fabric', 'apparel', 'clothing', 'garment', 'cotton', 'silk', 'wool',
      'ankara', 'kitenge', 'kente', 'african print', 'traditional', 'fashion', 'wear', 'dress',
      'shirt', 'trouser', 'pants', 'jacket', 'accessories', 'bag', 'footwear', 'shoe', 'leather'
    ],
    categoryName: 'Textiles & Apparel'
  },
  'Beauty & Personal Care': {
    keywords: [
      'beauty', 'cosmetic', 'skincare', 'shea butter', 'black soap', 'soap', 'oil', 'lotion',
      'cream', 'shampoo', 'conditioner', 'hair', 'makeup', 'lipstick', 'foundation', 'perfume',
      'fragrance', 'natural', 'organic beauty', 'personal care', 'hygiene', 'body care'
    ],
    categoryName: 'Beauty & Personal Care'
  },
  'Industrial & Construction': {
    keywords: [
      'industrial', 'construction', 'machinery', 'equipment', 'building', 'material', 'cement',
      'steel', 'iron', 'aluminum', 'tools', 'hardware', 'machinery', 'construction equipment',
      'infrastructure', 'engineering', 'manufacturing', 'factory', 'plant', 'heavy machinery'
    ],
    categoryName: 'Industrial & Construction'
  },
  'Home & Living': {
    keywords: [
      'home', 'furniture', 'decor', 'living', 'household', 'interior', 'furnishing', 'carpet',
      'rug', 'curtain', 'lamp', 'lighting', 'art', 'craft', 'handmade', 'traditional art',
      'sculpture', 'pottery', 'basket', 'woven', 'textile art', 'homeware', 'kitchenware'
    ],
    categoryName: 'Home & Living'
  },
  'Consumer Electronics': {
    keywords: [
      'electronics', 'electronic', 'phone', 'mobile', 'smartphone', 'tablet', 'laptop', 'computer',
      'device', 'gadget', 'accessories', 'charger', 'cable', 'power bank', 'battery', 'headphone',
      'speaker', 'camera', 'tv', 'television', 'audio', 'video', 'tech', 'technology'
    ],
    categoryName: 'Consumer Electronics'
  }
};

/**
 * Intelligently match product to popular category based on title and description
 * @param {string} title - Product title
 * @param {string} description - Product description
 * @returns {string|null} - Matched category name or null
 */
export function matchProductToPopularCategory(title = '', description = '') {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  // Score each category based on keyword matches
  const categoryScores = Object.entries(POPULAR_CATEGORIES).map(([categoryName, config]) => {
    let score = 0;
    const keywords = config.keywords;
    
    // Count keyword matches
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    return { categoryName, score };
  });
  
  // Sort by score (highest first)
  categoryScores.sort((a, b) => b.score - a.score);
  
  // Return the category with the highest score (if score > 0)
  if (categoryScores[0] && categoryScores[0].score > 0) {
    return categoryScores[0].categoryName;
  }
  
  return null;
}

/**
 * Find or create category in database and return category ID
 * @param {object} supabase - Supabase client
 * @param {string} categoryName - Category name to find or create
 * @returns {Promise<string|null>} - Category ID or null
 */
export async function findOrCreateCategory(supabase, categoryName) {
  if (!categoryName || !supabase) return null;
  
  try {
    // First, try to find existing category
    const { data: existingCategory, error: findError } = await supabase
      .from('categories')
      .select('id, name')
      .ilike('name', categoryName)
      .limit(1)
      .maybeSingle();
    
    if (findError) {
      console.error('Error finding category:', findError);
      return null;
    }
    
    if (existingCategory) {
      return existingCategory.id;
    }
    
    // If not found, try to find similar category
    const { data: similarCategories } = await supabase
      .from('categories')
      .select('id, name')
      .limit(50);
    
    if (similarCategories) {
      // Try fuzzy match
      const matched = similarCategories.find(cat => {
        const catName = cat.name.toLowerCase();
        const targetName = categoryName.toLowerCase();
        return catName.includes(targetName) || targetName.includes(catName);
      });
      
      if (matched) {
        return matched.id;
      }
    }
    
    // Create new category if not found
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert({
        name: categoryName,
        description: `Category for ${categoryName} products`,
        is_active: true
      })
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating category:', createError);
      return null;
    }
    
    return newCategory?.id || null;
  } catch (error) {
    console.error('Error in findOrCreateCategory:', error);
    return null;
  }
}

/**
 * Auto-assign category to product based on intelligence
 * @param {object} supabase - Supabase client
 * @param {string} title - Product title
 * @param {string} description - Product description
 * @param {string} existingCategoryId - Existing category ID (optional)
 * @returns {Promise<string|null>} - Category ID or null
 */
export async function autoAssignCategory(supabase, title, description, existingCategoryId = null) {
  // If category already assigned, use it
  if (existingCategoryId) {
    return existingCategoryId;
  }
  
  // Use intelligence to match category
  const matchedCategory = matchProductToPopularCategory(title, description);
  
  if (matchedCategory) {
    // Find or create the category in database
    const categoryId = await findOrCreateCategory(supabase, matchedCategory);
    return categoryId;
  }
  
  return null;
}

