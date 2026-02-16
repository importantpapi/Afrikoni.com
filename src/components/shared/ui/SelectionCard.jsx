import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SelectionCard({
    id,
    title,
    description,
    image,
    selected,
    onClick,
    className
}) {
    return (
        <div
            onClick={() => onClick(id)}
            className={cn(
                "group relative flex flex-col cursor-pointer rounded-os-sm border-2 transition-all duration-200 overflow-hidden bg-white dark:bg-afrikoni-charcoal",
                selected
                    ? "border-os-accent ring-1 ring-os-accent shadow-os-md"
                    : "border-gray-200 dark:border-gray-800 hover:border-os-accent/50 hover:shadow-md",
                className
            )}
        >
            {/* Image / Preview Area */}
            <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
                        <span className="text-os-sm">No Preview</span>
                    </div>
                )}

                {/* Selected Checkmark Badge */}
                {selected && (
                    <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-os-accent text-white shadow-sm animate-in zoom-in-50 duration-200">
                        <Check className="h-4 w-4" />
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className={cn(
                    "font-semibold text-os-lg mb-1 transition-colors",
                    selected ? "text-os-accent-dark dark:text-os-accent" : "text-gray-900 dark:text-gray-100"
                )}>
                    {title}
                </h3>
                {description && (
                    <p className="text-os-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
