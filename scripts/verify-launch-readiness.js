/**
 * Launch Readiness Verification Script
 * Run this to verify all critical systems are ready
 */

import { supabase } from '../src/api/supabaseClient.js';

async function verifyStorageBucket() {
  console.log('🔍 Verifying Supabase Storage bucket...');
  
  try {
    // Check if bucket exists by trying to list it
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }
    
    const productImagesBucket = buckets.find(b => b.name === 'product-images');
    
    if (!productImagesBucket) {
      console.error('❌ product-images bucket NOT FOUND');
      console.log('📋 Available buckets:', buckets.map(b => b.name));
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Click "New bucket"');
      console.log('3. Name: product-images');
      console.log('4. Enable "Public bucket"');
      console.log('5. Click "Create bucket"');
      return false;
    }
    
    console.log('✅ product-images bucket exists');
    console.log('   Public:', productImagesBucket.public);
    
    if (!productImagesBucket.public) {
      console.warn('⚠️  Bucket is not public - images may not display correctly');
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('1. Go to Supabase Dashboard → Storage → product-images');
      console.log('2. Click "Settings"');
      console.log('3. Enable "Public bucket"');
      console.log('4. Save');
    }
    
    // Test upload permission
    try {
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testPath = `test/${Date.now()}-test.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(testPath, testFile);
      
      if (uploadError) {
        console.warn('⚠️  Upload test failed:', uploadError.message);
        console.log('   This might be a permissions issue');
      } else {
        console.log('✅ Upload permission verified');
        // Clean up test file
        await supabase.storage.from('product-images').remove([testPath]);
      }
    } catch (testError) {
      console.warn('⚠️  Could not test upload:', testError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage verification failed:', error);
    return false;
  }
}

async function verifyDatabaseTables() {
  console.log('\n🔍 Verifying database tables...');
  
  const requiredTables = [
    'products',
    'product_images',
    'companies',
    'profiles',
    'rfqs',
    'quotes',
    'orders',
    'messages',
    'notifications',
    'categories'
  ];
  
  const missing = [];
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        missing.push(table);
        console.error(`❌ Table missing: ${table}`);
      } else {
        console.log(`✅ Table exists: ${table}`);
      }
    } catch (err) {
      console.warn(`⚠️  Could not verify ${table}:`, err.message);
    }
  }
  
  if (missing.length > 0) {
    console.error('\n❌ Missing tables:', missing.join(', '));
    return false;
  }
  
  return true;
}

async function verifyProductImagesTable() {
  console.log('\n🔍 Verifying product_images table structure...');
  
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error('❌ product_images table does not exist');
        return false;
      }
      console.warn('⚠️  Error querying product_images:', error.message);
    } else {
      console.log('✅ product_images table exists and is accessible');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 AFRIKONI Launch Readiness Verification\n');
  console.log('=' .repeat(50));
  
  const results = {
    storage: false,
    database: false,
    productImages: false
  };
  
  results.storage = await verifyStorageBucket();
  results.database = await verifyDatabaseTables();
  results.productImages = await verifyProductImagesTable();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log('Storage Bucket:', results.storage ? '✅' : '❌');
  console.log('Database Tables:', results.database ? '✅' : '❌');
  console.log('Product Images Table:', results.productImages ? '✅' : '❌');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 ALL CHECKS PASSED - Ready for launch!');
  } else {
    console.log('\n⚠️  SOME CHECKS FAILED - Please fix issues above');
  }
  
  return allPassed;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as verifyLaunchReadiness };

