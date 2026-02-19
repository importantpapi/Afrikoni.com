import React, { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { VerifyModal } from '@/components/verification/VerifyModal';
import { ShieldCheck } from 'lucide-react';

export function VerifyButton({ companyId, className, variant = 'default', children }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant={variant}
                className={className}
                onClick={() => setOpen(true)}
            >
                <ShieldCheck className="w-4 h-4 mr-2" />
                {children || "Get Verified"}
            </Button>

            <VerifyModal
                open={open}
                onOpenChange={setOpen}
                companyId={companyId}
                onSuccess={() => setOpen(false)}
            />
        </>
    );
}
