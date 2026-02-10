import React, { useState } from 'react';
import { SelectionGroup } from '@/components/shared/ui/SelectionGroup';
import { Logo } from '@/components/shared/ui/Logo';

export default function DesignDemo() {
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState(null);

    const roleOptions = [
        {
            id: 'buyer',
            title: 'Buyer Mode',
            description: 'Search and compare verified African suppliers. Place orders with Trade Shield protection.',
            // images could be added here
        },
        {
            id: 'seller',
            title: 'Seller Mode',
            description: 'Publish products, receive RFQs, and manage orders and payments.',
        },
        {
            id: 'logistics',
            title: 'Logistics Partner',
            description: 'Manage shipments, fleet, and warehousing operations.',
        }
    ];

    const themeOptions = [
        {
            id: 'light',
            title: 'Light Theme',
            description: 'Clean and bright interface for day usage.',
        },
        {
            id: 'dark',
            title: 'Dark Theme',
            description: 'Easy on the eyes for night usage.',
        },
        {
            id: 'system',
            title: 'System Default',
            description: 'Follows your operating system settings.',
        }
    ];

    const handleNext = () => {
        alert(`Proceeding with Role: ${selectedRole} | Theme: ${selectedTheme}`);
    };

    return (
        <div className="min-h-screen bg-afrikoni-offwhite dark:bg-black py-12">
            <div className="container mx-auto">
                <div className="flex justify-center mb-12">
                    <Logo type="full" size="lg" />
                </div>

                <div className="space-y-16">
                    <SelectionGroup
                        title="Choose your Role"
                        subtitle="Select how you want to interact with the marketplace today."
                        options={roleOptions}
                        value={selectedRole}
                        onChange={setSelectedRole}
                        onNext={handleNext}
                        canProceed={!!selectedRole}
                        nextLabel="Continue"
                    />

                    <div className="border-t border-gray-200 dark:border-gray-800 my-8" />

                    <SelectionGroup
                        title="Choose an editor theme type"
                        subtitle="Select the theme that best fits your workflow."
                        options={themeOptions}
                        value={selectedTheme}
                        onChange={setSelectedTheme}
                        onNext={() => { }}
                        onBack={() => console.log("Back clicked")}
                        canProceed={!!selectedTheme}
                        nextLabel="Next"
                    />
                </div>
            </div>
        </div>
    );
}
