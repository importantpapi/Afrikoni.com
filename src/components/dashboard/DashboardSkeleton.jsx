import React from 'react';
import { Surface } from '@/components/system/Surface';

export default function DashboardSkeleton() {
    return (
        <div className="os-page space-y-6 animate-pulse">
            {/* 1. Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 rounded mb-2" />
                    <div className="h-4 w-64 bg-gray-200 dark:bg-white/5 rounded" />
                </div>
            </div>

            {/* Status Bar */}
            <Surface variant="glass" className="p-4 border border-os-stroke/50">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                        <div className="h-2 w-full bg-gray-200 dark:bg-white/5 rounded" />
                    </div>
                </div>
            </Surface>

            {/* Today's Actions */}
            <Surface variant="glass" className="p-6 border border-os-stroke/50">
                <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-200 dark:bg-white/5 rounded-lg" />
                    ))}
                </div>
            </Surface>

            {/* 2. Trade State Panels Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Surface key={i} variant="glass" className="p-5 h-[140px] border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/10" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-16 bg-gray-200 dark:bg-white/10 rounded" />
                            <div className="h-3 w-24 bg-gray-200 dark:bg-white/5 rounded" />
                        </div>
                    </Surface>
                ))}
            </div>

            {/* 3. Main Surface */}
            <div className="grid lg:grid-cols-3 gap-6 h-auto min-h-[400px]">
                {/* Left: Timeline */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Surface variant="glass" className="p-6 h-[200px] border border-white/5">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-6" />
                        <div className="h-12 w-full bg-gray-200 dark:bg-white/5 rounded" />
                    </Surface>
                    <div className="flex-1 bg-gray-200 dark:bg-white/5 rounded-xl h-[400px]" />
                </div>

                {/* Right: AI */}
                <div className="flex flex-col gap-6">
                    <Surface variant="glass" className="p-5 h-[300px] border border-white/5">
                        <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded mb-4" />
                        <div className="space-y-4">
                            <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-lg" />
                            <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-lg" />
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    );
}
