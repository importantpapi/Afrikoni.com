import React from 'react';
import { SelectionCard } from './SelectionCard';
import { Button } from './button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SelectionGroup({
    title,
    subtitle,
    options = [],
    value,
    onChange,
    onNext,
    onBack,
    nextLabel = "Next",
    backLabel = "Back",
    canProceed = true
}) {
    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-10 space-y-2">
                {title && (
                    <h2 className="text-3xl font-bold text-afrikoni-brown dark:text-white">
                        {title}
                    </h2>
                )}
                {subtitle && (
                    <p className="text-afrikoni-deep dark:text-gray-400 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {options.map((option) => (
                    <SelectionCard
                        key={option.id}
                        id={option.id}
                        title={option.title}
                        description={option.description}
                        image={option.image}
                        selected={value === option.id}
                        onClick={onChange}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-afrikoni-cream dark:border-gray-800">
                <div className={cn(!onBack && "opacity-0 pointer-events-none")}>
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-afrikoni-deep hover:text-afrikoni-brown dark:text-gray-400 dark:hover:text-white"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {backLabel}
                    </Button>
                </div>

                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={!canProceed || !value}
                    className="min-w-[120px]"
                >
                    {nextLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
