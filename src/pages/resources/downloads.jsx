import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, BookOpen, FileCheck, Image, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import SEO from '@/components/SEO';
import { supabase } from '@/api/supabaseClient';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Downloads section for resources (PDFs, manuals, plans)
 * Fetches downloadable resources from Supabase
 */
export default function Downloads() {
  const { t } = useLanguage();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      // Try to load from Supabase resources table
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      // Fallback to placeholder resources
      setResources(getPlaceholderResources());
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderResources = () => [
    {
      id: 1,
      title: 'Afrikoni Supplier Guide',
      description: 'Complete guide for suppliers on how to list products and grow your business',
      category: 'guides',
      file_url: '#',
      file_type: 'pdf',
      file_size: '2.5 MB',
      icon: BookOpen
    },
    {
      id: 2,
      title: 'Buyer Protection Policy',
      description: 'Detailed explanation of our escrow protection and buyer guarantees',
      category: 'policies',
      file_url: '#',
      file_type: 'pdf',
      file_size: '1.8 MB',
      icon: FileCheck
    },
    {
      id: 3,
      title: 'KYC/KYB Verification Checklist',
      description: 'Step-by-step checklist for completing supplier verification',
      category: 'guides',
      file_url: '#',
      file_type: 'pdf',
      file_size: '950 KB',
      icon: FileText
    }
  ];

  const categories = [
    { id: 'all', label: 'All Resources' },
    { id: 'guides', label: 'Guides' },
    { id: 'policies', label: 'Policies' },
    { id: 'templates', label: 'Templates' },
    { id: 'brochures', label: 'Brochures' }
  ];

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return FileText;
      case 'doc':
      case 'docx':
        return FileText;
      case 'jpg':
      case 'png':
      case 'jpeg':
        return Image;
      case 'mp4':
      case 'mov':
        return Video;
      default:
        return Download;
    }
  };

  return (
    <>
      <SEO 
        title="Downloads & Resources - Afrikoni | AFRIKONI"
        description="Download guides, policies, templates, and resources for buyers and suppliers on Afrikoni B2B marketplace."
        url="/resources/downloads"
      />
      <div className="min-h-screen bg-afrikoni-offwhite">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-afrikoni-gold/20 via-afrikoni-cream to-afrikoni-offwhite border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-afrikoni-gold/20 mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Download className="w-8 h-8 text-afrikoni-gold" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-afrikoni-chestnut mb-6">
                Downloads & Resources
              </h1>
              <p className="text-lg md:text-xl text-afrikoni-deep mb-8">
                Access guides, policies, templates, and helpful resources for your B2B trade journey
              </p>
            </motion.div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-6 bg-white border-b border-afrikoni-gold/20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div 
              className="flex flex-wrap gap-2 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-afrikoni-gold text-afrikoni-chestnut shadow-md'
                      : 'bg-afrikoni-cream text-afrikoni-deep hover:bg-afrikoni-gold/20'
                  }`}
                >
                  {cat.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Resources Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4">
            {loading ? (
              <motion.div 
                className="flex items-center justify-center h-64"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
              </motion.div>
            ) : filteredResources.length === 0 ? (
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Download className="w-16 h-16 text-afrikoni-gold/50 mx-auto mb-4" />
                </motion.div>
                <p className="text-afrikoni-deep/70">No resources available in this category yet.</p>
              </motion.div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource, idx) => {
                  const Icon = resource.icon || getFileIcon(resource.file_type);
                  return (
                    <motion.div
                      key={resource.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <Card className="h-full border-afrikoni-gold/20 hover:border-afrikoni-gold transition-all flex flex-col">
                        <CardContent className="p-6 flex-1 flex flex-col">
                          <motion.div 
                            className="w-12 h-12 rounded-full bg-afrikoni-gold/20 flex items-center justify-center mb-4"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Icon className="w-6 h-6 text-afrikoni-gold" />
                          </motion.div>
                          <h3 className="font-bold text-afrikoni-chestnut text-xl mb-2">
                            {resource.title}
                          </h3>
                          <p className="text-afrikoni-deep leading-relaxed mb-4 flex-1">
                            {resource.description}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-afrikoni-gold/20">
                            <span className="text-xs text-afrikoni-deep/70">
                              {resource.file_type?.toUpperCase()} • {resource.file_size}
                            </span>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                asChild
                                variant="outline"
                                className="border-afrikoni-gold text-afrikoni-chestnut hover:bg-afrikoni-gold/10"
                              >
                                <a
                                  href={resource.file_url}
                                  download
                                  target={resource.file_url !== '#' ? '_blank' : undefined}
                                  rel={resource.file_url !== '#' ? 'noopener noreferrer' : undefined}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

