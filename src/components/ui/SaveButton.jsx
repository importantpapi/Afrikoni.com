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
      
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', userData.id)
        .eq('item_id', itemId)
        .eq('item_type', itemType)
        .single();
      
      setIsSaved(!!data);
    } catch (error) {
      setIsSaved(false);
    }
  };

  const handleToggle = async () => {
    if (!userId) {
      toast.error('Please log in to save items');
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .eq('item_type', itemType);
        
        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        // Save
        const { error } = await supabase
          .from('saved_items')
          .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType
          });
        
        if (error) throw error;
        setIsSaved(true);
        toast.success('Saved to your list');
      }
    } catch (error) {
      toast.error('Failed to update saved status');
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

