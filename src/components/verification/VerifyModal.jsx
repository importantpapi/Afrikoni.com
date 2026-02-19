import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/shared/ui/tabs';
import { useVerification } from '@/hooks/useVerification';
import { Loader2, CheckCircle, Upload, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import CountrySelect from '@/components/shared/ui/CountrySelect';
import { toast } from 'sonner';

export function VerifyModal({ open, onOpenChange, companyId, onSuccess }) {
    const {
        step,
        setStep,
        loading,
        progress,
        extractedData,
        startVerification,
        extractFromEvidence,
        finalizeVerification,
        error
    } = useVerification(companyId);

    // Step 1 State
    const [businessName, setBusinessName] = useState('');
    const [country, setCountry] = useState('');

    // Step 2 State
    const [activeTab, setActiveTab] = useState('link');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState(null);

    // Step 3 State
    const [confirmedData, setConfirmedData] = useState({});

    useEffect(() => {
        if (extractedData) {
            setConfirmedData(extractedData);
        }
    }, [extractedData]);

    const handleStart = () => {
        if (!businessName || !country) return;
        startVerification({ business_name: businessName, country });
    };

    const handleExtract = () => {
        if (activeTab === 'link' && !url) {
            toast.error('Please enter a valid URL');
            return;
        }
        if (activeTab === 'upload' && !file) {
            toast.error('Please select a file');
            return;
        }
        extractFromEvidence(activeTab === 'upload' ? file : null, activeTab === 'link' ? url : null);
    };

    const handleFinalize = async () => {
        await finalizeVerification(confirmedData);
        if (onSuccess) onSuccess();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white gap-0">
                {/* Progress Bar */}
                <div className="h-1 w-full bg-os-stroke/20">
                    <div
                        className="h-full bg-os-accent transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <DialogHeader>
                                <DialogTitle>Verify your business</DialogTitle>
                                <DialogDescription>Get verified in under 60 seconds. No paperwork now.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Business Name</Label>
                                    <Input
                                        placeholder="e.g. Globex Trading Ltd"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <CountrySelect
                                        value={country}
                                        onChange={setCountry}
                                        placeholder="Select country"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full bg-os-accent hover:bg-os-accent/90 text-white"
                                onClick={handleStart}
                                disabled={loading || !businessName || !country}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <DialogHeader>
                                <DialogTitle>Let AI fill the details</DialogTitle>
                                <DialogDescription>Paste a link or upload a document to autofill.</DialogDescription>
                            </DialogHeader>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="link">Website / Social Link</TabsTrigger>
                                    <TabsTrigger value="upload">Upload Document</TabsTrigger>
                                </TabsList>

                                <TabsContent value="link" className="space-y-4 mt-0">
                                    <div className="space-y-2">
                                        <Label>Link URL</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                className="pl-9"
                                                placeholder="https://... or LinkedIn profile"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="upload" className="space-y-4 mt-0">
                                    <div className="border-2 border-dashed border-os-stroke rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            onChange={(e) => setFile(e.target.files[0])}
                                        />
                                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600 font-medium">
                                            {file ? file.name : "Drop business document or photo here"}
                                        </p>
                                        {!file && <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 5MB</p>}
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button
                                className="w-full bg-os-accent hover:bg-os-accent/90 text-white"
                                onClick={handleExtract}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Reading...
                                    </>
                                ) : (
                                    "Verify now"
                                )}
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <DialogHeader>
                                <DialogTitle>Confirm your details</DialogTitle>
                                <DialogDescription>Review the information AI extracted.</DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4">
                                {['business_name', 'city', 'email', 'category', 'phone', 'website'].map((field) => (
                                    <div key={field} className="space-y-1">
                                        <Label className="capitalize text-xs text-gray-500 font-medium">{field.replace('_', ' ')}</Label>
                                        <Input
                                            value={confirmedData[field] || ''}
                                            onChange={(e) => setConfirmedData({ ...confirmedData, [field]: e.target.value })}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full bg-os-accent hover:bg-os-accent/90 text-white"
                                onClick={handleFinalize}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Finish verification
                            </Button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-6 py-6 animate-in zoom-in-95 duration-300">
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
                                <ShieldCheck className="w-10 h-10 text-green-600" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold text-gray-900">You're Verified ✅</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    You can now appear in search and receive buyer requests. Escrow unlock is in progress.
                                </p>
                            </div>

                            <div className="space-y-3 pt-4">
                                <Button className="w-full bg-os-accent text-white" onClick={() => onOpenChange(false)}>
                                    Go to Dashboard
                                </Button>
                                <Button variant="outline" className="w-full border-os-stroke" onClick={() => onOpenChange(false)}>
                                    List a product
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
