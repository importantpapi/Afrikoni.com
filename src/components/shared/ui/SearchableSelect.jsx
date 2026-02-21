import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchableSelect - A premium, theme-aware selection component
 * with integrated search and flickering-free interactions.
 */
export function SearchableSelect({
    value,
    onValueChange,
    options = [],
    placeholder = "Select option",
    icon: Icon = Globe,
    className,
    allowCustom = false,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const filteredOptions = (options || []).filter(opt =>
        String(opt).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onValueChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-12 w-full flex items-center justify-between px-4 rounded-lg border transition-all",
                    "bg-white border-os-stroke text-os-text-primary shadow-sm",
                    "hover:border-os-accent/30 focus:outline-none focus:ring-2 focus:ring-os-accent/20",
                    isOpen && "border-os-accent/50 shadow-os-md",
                    className
                )}
                {...props}
            >
                <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
                    <Icon className="w-4 h-4 text-os-accent shrink-0" />
                    <span className="truncate">{value || placeholder}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 opacity-50 transition-transform pointer-events-none", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={cn(
                            "absolute z-[100] top-full left-0 right-0 mt-2",
                            "bg-white border border-os-stroke rounded-xl shadow-os-lg overflow-hidden"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-os-stroke bg-white text-os-text-primary">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-os-text-secondary opacity-50" />
                                <input
                                    autoFocus
                                    placeholder="Search or type new..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className={cn(
                                        "w-full pl-9 pr-4 h-10 rounded-lg text-sm",
                                        "bg-white border-os-stroke text-os-text-primary shadow-sm",
                                        "focus:outline-none focus:ring-2 focus:ring-os-accent/20 transition-all"
                                    )}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && allowCustom && searchTerm) {
                                            handleSelect(searchTerm);
                                        }
                                        if (e.key === 'Escape') setIsOpen(false);
                                    }}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => (
                                    <button
                                        key={`${opt}-${idx}`}
                                        onClick={() => handleSelect(opt)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all text-left",
                                            "hover:bg-os-accent/10 hover:text-os-accent",
                                            value === opt ? "bg-os-accent/5 text-os-accent font-semibold" : "text-os-text-primary"
                                        )}
                                    >
                                        <span>{opt}</span>
                                        {value === opt && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 px-4 text-center">
                                    {allowCustom && searchTerm ? (
                                        <div className="space-y-3">
                                            <p className="text-xs text-os-text-secondary">Not found in list. Use your custom entry?</p>
                                            <button
                                                onClick={() => handleSelect(searchTerm)}
                                                className="px-4 py-2 bg-os-accent text-black rounded-lg text-sm font-bold shadow-os-sm hover:scale-105 transition-transform"
                                            >
                                                Use "{searchTerm}"
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-os-text-secondary opacity-50">No results found</p>
                                            {allowCustom && <p className="text-[10px] text-os-accent font-medium uppercase tracking-wider">Type to enter manually</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
