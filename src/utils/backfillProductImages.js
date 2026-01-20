/**
 * Backfill product images from Supabase Storage to product_images table
 * This script links existing storage files to products
 */

import { supabase } from '@/lib/supabase';

/**
 * Get public URL for a storage file
 */
function getStoragePublicUrl(path) {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Backfill images for a specific product
 */
export async function backfillProductImages(productId, userId) {
  try {
    // List files in storage for this user/product
    const { data: files, error: listError } = await supabase.storage
      .from('product-images')
      .list(`products/${userId}`, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('Error listing storage files:', listError);
      return { success: false, error: listError };
    }

    if (!files || files.length === 0) {
      return { success: true, count: 0, message: 'No images found in storage' };
    }

    // Filter out thumbnails and get main images
    const mainImages = files.filter(file => 
      !file.name.includes('-thumb') && 
      (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png') || file.name.endsWith('.webp'))
    );

    if (mainImages.length === 0) {
      return { success: true, count: 0, message: 'No main images found' };
    }

    // ✅ KERNEL-SCHEMA ALIGNMENT: Get product name for alt text (DB has 'name', not 'title')
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    // Insert images into product_images table
    const imageRecords = mainImages.map((file, index) => {
      const path = `products/${userId}/${file.name}`;
      const publicUrl = getStoragePublicUrl(path);
      
      return {
        product_id: productId,
        url: publicUrl,
        alt_text: product?.name || 'Product image',
        is_primary: index === 0,
        sort_order: index
      };
    });

    // Delete existing images for this product first
    await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    // Insert new images
    const { data: inserted, error: insertError } = await supabase
      .from('product_images')
      .insert(imageRecords)
      .select();

    if (insertError) {
      console.error('Error inserting images:', insertError);
      return { success: false, error: insertError };
    }

    return { 
      success: true, 
      count: inserted?.length || 0, 
      images: inserted 
    };
  } catch (error) {
    console.error('Error in backfillProductImages:', error);
    return { success: false, error };
  }
}

/**
 * Backfill all products for a user
 */
export async function backfillAllUserProducts(userId) {
  try {
    // ✅ KERNEL-SCHEMA ALIGNMENT: Get product name (DB has 'name', not 'title')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, company_id')
      .eq('status', 'active');

    if (productsError) {
      return { success: false, error: productsError };
    }

    if (!products || products.length === 0) {
      return { success: true, count: 0, message: 'No products found' };
    }

    const results = [];
    for (const product of products) {
      const result = await backfillProductImages(product.id, userId);
      results.push({ productId: product.id, ...result });
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: true,
      total: products.length,
      successful: successful.length,
      failed: failed.length,
      results
    };
  } catch (error) {
    console.error('Error in backfillAllUserProducts:', error);
    return { success: false, error };
  }
}

