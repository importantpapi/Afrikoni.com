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

export function CountrySelect({ value, onValueChange, countries = [], placeholder = "Select country" }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCountries = countries.filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="h-14 bg-os-surface-0 border-os-stroke rounded-os-md text-os-text-primary focus:ring-os-accent/20 focus:border-os-accent/30 transition-all">
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-os-accent opacity-60" />
                    <SelectValue placeholder={placeholder} />
                </div>
            </SelectTrigger>
            <SelectContent className="bg-os-card border-os-stroke backdrop-blur-2xl p-0 overflow-hidden shadow-os-lg min-w-[280px]">
                {/* Search Header */}
                <div className="p-3 border-b border-os-stroke bg-os-surface-1 sticky top-0 z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-os-text-secondary opacity-50" />
                        <Input
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-os-surface-2 border-os-stroke rounded-os-sm text-os-xs font-bold focus:bg-os-surface-3 transition-all text-os-text-primary"
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
                                className="rounded-os-sm py-3 px-4 hover:bg-os-accent/10 focus:bg-os-accent/10 focus:text-os-accent transition-colors font-bold text-os-sm cursor-pointer group text-os-text-primary"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="opacity-70 group-hover:opacity-100 group-focus:opacity-100">{country}</span>
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        <div className="py-8 px-4 text-center">
                            <p className="text-os-xs font-black uppercase tracking-widest text-os-text-secondary opacity-40">No countries found</p>
                        </div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
}

export default CountrySelect;
