import React, { useState } from 'react';
import { Button } from '@/components/shared/ui/button';
import { seedData } from '@/utils/dev/seeder';
import { useDashboardKernel } from '@/hooks/useDashboardKernel';
import { Database } from 'lucide-react';

export default function SeedButton() {
    const { user, profileCompanyId } = useDashboardKernel();
    const [seeding, setSeeding] = useState(false);

    const handleSeed = async () => {
        setSeeding(true);
        await seedData(user, profileCompanyId);
        setSeeding(false);
    };

    if (import.meta.env.PROD) return null; // Hide in prod

    return (
        <Button
            size="sm"
            variant="outline"
            className="gap-2 bg-amber-100/50 hover:bg-amber-200/50 text-amber-900 border-amber-200"
            onClick={handleSeed}
            disabled={seeding}
        >
            <Database className="h-4 w-4" />
            {seeding ? 'Seeding...' : 'Seed Data'}
        </Button>
    );
}
