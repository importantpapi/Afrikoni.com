import React, { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/shared/ui/select';
import { Input } from '@/components/shared/ui/input';
import { Search, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

import { COUNTRY_NAMES } from '@/utils/countries';

export function CountrySelect({ value, onValueChange, countries, placeholder = "Select country", className }) {
    const [searchTerm, setSearchTerm] = useState('');

    // Use provided countries or default to all available countries
    const availableCountries = countries || Object.values(COUNTRY_NAMES);

    const filteredCountries = availableCountries.filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={cn("h-14 bg-white/[0.03] border-white/10 rounded-os-md text-white focus:ring-os-accent/20 focus:border-os-accent/30 transition-all", className)}>
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-os-accent opacity-60" />
                    <SelectValue placeholder={placeholder} />
                </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0A0A0A]/95 backdrop-blur-2xl border-white/10 p-0 overflow-hidden shadow-2xl min-w-[280px]">
                {/* Search Header */}
                <div className="p-3 border-b border-white/5 bg-white/[0.02] sticky top-0 z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-os-muted opacity-50" />
                        <Input
                            placeholder="Search nodes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-white/5 border-white/5 rounded-os-sm text-os-xs font-bold focus:bg-white/10 transition-all"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key !== 'Tab') e.stopPropagation();
                            }}
                        />
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                    {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                            <SelectItem
                                key={country}
                                value={country}
                                className="rounded-os-sm py-3 px-4 focus:bg-os-accent/10 focus:text-os-accent transition-colors font-bold text-os-sm cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="opacity-70 group-focus:opacity-100">{country}</span>
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        <div className="py-8 px-4 text-center">
                            <p className="text-os-xs font-black uppercase tracking-widest text-os-muted opacity-40">No nodes found</p>
                        </div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
}

export default CountrySelect;
