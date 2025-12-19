import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './button';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { toast } from 'sonner';

export default function SaveButton({ itemId, itemType, className = '' }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkSavedStatus();
  }, [itemId, itemType]);

  const checkSavedStatus = async () => {
    try {
      const { getCurrentUserAndRole } = await import('@/utils/authHelpers');
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      if (!userData) {
        setIsSaved(false);
        return;
      }
      
      setUserId(userData.id);
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', userData.id)
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
    
    if (!userId) {
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
          .eq('user_id', userId)
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
          .eq('user_id', userId)
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
            user_id: userId,
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

