/**
 * Deal Actions Component
 * 
 * Buttons that change state, not just text
 * - Request documents (creates document request)
 * - Confirm specs (updates deal status)
 * - Proceed to deal (creates deal/order)
 * 
 * These trigger workflow actions, not just messages
 */

import React, { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { FileText, CheckCircle, Hand, Loader2 } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DEAL_ACTIONS = [
  {
    label: 'Request Documents',
    icon: FileText,
    action: 'request_docs',
    description: 'Request product specifications and certifications'
  },
  {
    label: 'Confirm Specs',
    icon: CheckCircle,
    action: 'confirm_specs',
    description: 'Confirm product specifications are correct'
  },
  {
    label: 'Proceed to Deal',
    icon: Hand,
    action: 'create_deal',
    description: 'Start the deal process'
  }
];

export default function DealActions({ conversation, companyId, onActionComplete }) {
  const [isProcessing, setIsProcessing] = useState(null);
  const navigate = useNavigate();

  const handleAction = async (action) => {
    setIsProcessing(action);
    try {
      switch (action) {
        case 'request_docs':
          await handleRequestDocuments();
          break;
        case 'confirm_specs':
          await handleConfirmSpecs();
          break;
        case 'create_deal':
          await handleCreateDeal();
          break;
      }
      if (onActionComplete) {
        onActionComplete(action);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error('Failed to process action. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRequestDocuments = async () => {
    // Create a document request record
    const { error } = await supabase
      .from('document_requests')
      .insert({
        conversation_id: conversation.id,
        requester_company_id: companyId,
        supplier_company_id: conversation.otherCompany?.id,
        status: 'pending',
        requested_at: new Date().toISOString()
      });

    if (error) throw error;

    // Also send a message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_company_id: companyId,
        content: '📄 Document request created. Please upload: Product specifications, Certifications, Quality certificates',
        message_type: 'action',
        action_type: 'request_documents'
      });

    toast.success('Document request sent');
  };

  const handleConfirmSpecs = async () => {
    // Update conversation with confirmed specs
    const { error } = await supabase
      .from('conversations')
      .update({
        specs_confirmed: true,
        specs_confirmed_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    if (error) throw error;

    // Send confirmation message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_company_id: companyId,
        content: '✅ Product specifications confirmed',
        message_type: 'action',
        action_type: 'confirm_specs'
      });

    toast.success('Specifications confirmed');
  };

  const handleCreateDeal = async () => {
    // Navigate to deal creation page with conversation context
    navigate(`/dashboard/deals/new?conversation=${conversation.id}&supplier=${conversation.otherCompany?.id}`);
  };

  return (
    <div className="space-y-2 px-4 py-3 border-t">
      <div className="text-xs font-semibold uppercase tracking-wide mb-2">
        Deal Actions
      </div>
      <div className="flex flex-wrap gap-2">
        {DEAL_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isProcessingAction = isProcessing === action.action;
          
          return (
            <Button
              key={action.action}
              variant="outline"
              onClick={() => handleAction(action.action)}
              disabled={isProcessing !== null}
              className="min-h-[44px] px-3 text-sm hover:bg-afrikoni-gold/10 flex-1 min-w-[120px]"
              title={action.description}
            >
              {isProcessingAction ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Icon className="w-4 h-4 mr-1.5" />
              )}
              {action.label}
            </Button>
          );
        })}
      </div>
      <p className="text-xs mt-2">
        These actions update deal status and create records in Afrikoni
      </p>
    </div>
  );
}

