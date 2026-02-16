import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/shared/ui/button';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SignaturePad = ({ onSign, className }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Setup drawing styles for "Institutional Gold" feel
        ctx.strokeStyle = '#D4A937';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
    }, []);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        const ctx = canvas.getContext('2d');
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (hasSigned) {
            const dataUrl = canvasRef.current.toDataURL();
            onSign(dataUrl);
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        onSign(null);
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="relative aspect-[3/1] bg-black/40 border border-os-accent/20 rounded-os-md overflow-hidden cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />

                {/* Background Guide Line */}
                <div className="absolute bottom-[30%] left-10 right-10 h-px bg-white/5 pointer-events-none" />

                {!hasSigned && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 capitalize text-os-xs tracking-[0.4em] font-black text-os-accent">
                        Sovereign Proof Signature Pad
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-os-xs font-bold uppercase tracking-widest text-os-muted">
                    <ShieldCheck className={cn("w-3 h-3", hasSigned ? "text-emerald-500" : "opacity-30")} />
                    <span>{hasSigned ? "Proof Captured" : "Awaiting Signature"}</span>
                </div>

                <Button
                    variant="ghost"
                    size="xs"
                    onClick={clear}
                    className="h-8 text-os-xs font-black uppercase text-os-muted hover:text-red-400 group"
                >
                    <RotateCcw className="w-3 h-3 mr-1 group-hover:rotate-[-90deg] transition-transform" />
                    Reset
                </Button>
            </div>
        </div>
    );
};

export default SignaturePad;
