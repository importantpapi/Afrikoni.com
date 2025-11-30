/**
 * Simple recommendation engine
 */

export function getRecommendedProducts(viewHistory, allProducts, limit = 6) {
  if (!Array.isArray(viewHistory) || viewHistory.length === 0) return [];
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
  
  // Get most viewed category
  const categoryCounts = {};
  viewHistory.forEach(item => {
    if (item && item.category_id) {
      categoryCounts[item.category_id] = (categoryCounts[item.category_id] || 0) + 1;
    }
  });
  
  const topCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // Get most viewed country
  const countryCounts = {};
  viewHistory.forEach(item => {
    if (item && item.country) {
      countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
    }
  });
  
  const topCountry = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  
  // Find products matching top category or country
  const recommended = allProducts
    .filter(product => {
      if (!product) return false;
      // Exclude already viewed
      const viewedIds = viewHistory.map(item => item?.id).filter(Boolean);
      if (viewedIds.includes(product.id)) return false;
      
      // Match category or country
      return (topCategory && product.category_id === topCategory) ||
             (topCountry && product.country_of_origin === topCountry);
    })
    .slice(0, limit);
  
  return recommended;
}

export function getSimilarProducts(product, allProducts, limit = 4) {
  if (!product) return [];
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
  
  return allProducts
    .filter(p => {
      if (!p || !product) return false;
      if (p.id === product.id) return false;
      if (p.category_id !== product.category_id) return false;
      
      // Similar price range (within 50%)
      const productPrice = product.price_min || product.price || 0;
      const pPrice = p.price_min || p.price || 0;
      if (productPrice > 0 && pPrice > 0) {
        const diff = Math.abs(productPrice - pPrice) / productPrice;
        if (diff > 0.5) return false;
      }
      
      return true;
    })
    .slice(0, limit);
}

