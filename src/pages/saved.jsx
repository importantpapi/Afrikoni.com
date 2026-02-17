
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/api/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowRight, Package, Building, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import SEO from '@/components/SEO';

export default function SavedPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [savedProducts, setSavedProducts] = useState([]);
    const [savedSuppliers, setSavedSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');

    useEffect(() => {
        if (!loading) {
            if (user) {
                fetchSavedItems();
            } else {
                setIsLoading(false);
            }
        }
    }, [user, loading]);

    const fetchSavedItems = async () => {
        try {
            setIsLoading(true);
            // Fetch all saved items
            const { data: savedItems, error } = await supabase
                .from('saved_items')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            if (!savedItems || savedItems.length === 0) {
                setSavedProducts([]);
                setSavedSuppliers([]);
                return;
            }

            // Process Products
            const productItems = savedItems.filter(item => item.item_type === 'product');
            if (productItems.length > 0) {
                const productIds = productItems.map(item => item.item_id);
                const { data: products } = await supabase
                    .from('products')
                    .select('*, company:companies(name, verification_status)')
                    .in('id', productIds);

                if (products) {
                    setSavedProducts(products);
                }
            }

            // Process Suppliers
            const supplierItems = savedItems.filter(item => item.item_type === 'supplier');
            if (supplierItems.length > 0) {
                const supplierIds = supplierItems.map(item => item.item_id);
                const { data: suppliers } = await supabase
                    .from('companies')
                    .select('*')
                    .in('id', supplierIds);

                if (suppliers) {
                    setSavedSuppliers(suppliers);
                }
            }

        } catch (error) {
            console.error('Error fetching saved items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-os-accent" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-os-accent/10 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-os-accent" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">Save Your Favorites</h1>
                <p className="text-os-lg text-gray-600 max-w-lg mb-8">
                    Create an account to save products and suppliers, compare quotes, and organize your sourcing.
                </p>
                <div className="flex gap-4">
                    <Link to="/login">
                        <Button variant="outline" className="px-8 py-6 text-lg">Login</Button>
                    </Link>
                    <Link to="/signup">
                        <Button className="bg-os-accent text-black px-8 py-6 text-lg font-bold">
                            Join Now
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <SEO title="Saved Items - Afrikoni" description="View your saved products and suppliers" />
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                            <Heart className="w-8 h-8 text-os-accent fill-os-accent" />
                            Saved Items
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Manage your shortlisted products and potential partners.
                        </p>
                    </div>

                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-6 py-2.5 rounded-md font-medium transition-all ${activeTab === 'products'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Products ({savedProducts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`px-6 py-2.5 rounded-md font-medium transition-all ${activeTab === 'suppliers'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Suppliers ({savedSuppliers.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'products' ? (
                    savedProducts.length > 0 ? (
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {savedProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                                >
                                    <div className="aspect-square bg-gray-100 relative">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Package className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
                                        <p className="text-sm text-gray-500 mb-3 truncate">{product.company?.name}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="font-bold text-os-accent text-lg">
                                                {product.currency} {product.price?.toLocaleString()}
                                            </span>
                                            <Link to={`/product/${product.id}`}>
                                                <Button size="sm" variant="outline" className="rounded-full">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No saved products</h3>
                            <p className="text-gray-500 mb-6">Start exploring the marketplace to find products.</p>
                            <Link to="/products">
                                <Button className="bg-os-accent text-black">Browse Products</Button>
                            </Link>
                        </div>
                    )
                ) : (
                    savedSuppliers.length > 0 ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {savedSuppliers.map((supplier) => (
                                <motion.div
                                    key={supplier.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                            {supplier.logo_url ? (
                                                <img src={supplier.logo_url} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{supplier.name || supplier.company_name}</h3>
                                            <p className="text-sm text-gray-500">{supplier.country}</p>
                                            {(supplier.verification_status === 'verified' || supplier.verified) && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 mt-2">
                                                    Verified
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/business/${supplier.id}`} className="w-full block">
                                        <Button variant="outline" className="w-full">View Profile</Button>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl">
                            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No saved suppliers</h3>
                            <p className="text-gray-500 mb-6">Connect with verified suppliers across Africa.</p>
                            <Link to="/suppliers">
                                <Button className="bg-os-accent text-black">Find Suppliers</Button>
                            </Link>
                        </div>
                    )
                )}
            </div>
        </>
    );
}
