import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

export default function SaveButton({ itemId, itemType, className = '' }) {
  // Use centralized AuthProvider
  const { user, profile, role, authReady, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Extract primitive userId to avoid object identity issues
  const userId = user?.id || null;
  
  useEffect(() => {
    // GUARD: Wait for auth to be ready
    if (!authReady || authLoading) {
      return;
    }

    // Now safe to check saved status
    checkSavedStatus();
  }, [itemId, itemType, authReady, authLoading, userId]); // ✅ userId is primitive, not user object

  const checkSavedStatus = async () => {
    try {
      if (!user) {
        setIsSaved(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (expected)
        console.error('Error checking saved status:', error);
      }
      
      setIsSaved(!!data);
    } catch (error) {
      console.error('Error in checkSavedStatus:', error);
      setIsSaved(false);
    }
  };

  const handleToggle = async (e) => {
    // Prevent event from bubbling up to parent (e.g., Link or Card onClick)
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to save items');
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Unsave
        const { error, count } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .select('id', { count: 'exact' });
        
        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        // Save - check if already exists first
        const { data: existing } = await supabase
          .from('saved_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .maybeSingle();
        
        if (existing) {
          setIsSaved(true);
          toast.info('Item is already saved');
          return;
        }
        
        // Insert new saved item
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: user.id,
            item_id: itemId,
            item_type: itemType
          })
          .select()
          .single();
        
        if (error) {
          // Handle duplicate key error gracefully
          if (error.code === '23505') {
            setIsSaved(true);
            toast.info('Item is already saved');
          } else {
            throw error;
          }
        } else {
          setIsSaved(true);
          toast.success('Saved to your list');
        }
      }
    } catch (error) {
      console.error('Save button error:', error);
      const errorMessage = error.message || 'Unknown error';
      
      if (error.code === '23505') {
        // Duplicate key - item already saved
        setIsSaved(true);
        toast.info('Item is already saved');
      } else if (error.code === '42501') {
        // Permission denied - RLS policy issue
        toast.error('Permission denied. Please ensure you are logged in.');
      } else {
        toast.error(`Failed to ${isSaved ? 'unsave' : 'save'} item: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={`${className} bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm hover:shadow-md transition-all rounded-full p-2`}
      aria-label={isSaved ? `Remove ${itemType} from saved` : `Save ${itemType}`}
    >
      <Heart 
        className={`w-5 h-5 transition-all ${isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-700 hover:text-red-500 hover:scale-105'}`} 
        aria-hidden="true"
      />
    </Button>
  );
}

