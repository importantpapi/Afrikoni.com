import { FileText, Scale, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Terms of Service
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Last Updated: February 18, 2026
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 prose prose-gray dark:prose-invert max-w-none">

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            By accessing or using the Afrikoni platform ("Service"), you agree to be bound by these Terms of Service ("Terms").
                            If you do not agree to these Terms, do not use the Service.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Afrikoni is a B2B trade platform connecting buyers and sellers of African products and services. The Service includes:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li>Product discovery and browsing</li>
                            <li>Request for Quotation (RFQ) management</li>
                            <li>Trade facilitation and escrow services</li>
                            <li>Logistics coordination</li>
                            <li>Supplier verification services</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. User Accounts</h2>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3.1 Registration</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                            <li>You must provide accurate, current, and complete information during registration</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                            <li>You must be at least 18 years old and legally able to enter into contracts</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3.2 Account Types</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Buyer Account:</strong> For companies purchasing products/services</li>
                            <li><strong>Seller Account:</strong> For companies selling products/services</li>
                            <li>You may not create multiple accounts for fraudulent purposes</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. User Conduct</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">You agree NOT to:</p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit malicious code or viruses</li>
                            <li>Engage in fraudulent activities</li>
                            <li>Harass, abuse, or harm other users</li>
                            <li>Manipulate prices or engage in anti-competitive behavior</li>
                            <li>Misrepresent your identity or company information</li>
                        </ul>
                    </section>

                    <section className="mb-8 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            9. Limitation of Liability
                        </h2>
                        <p className="text-gray-900 dark:text-white font-semibold mb-4">IMPORTANT: PLEASE READ CAREFULLY</p>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9.2 Liability Cap</h3>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
                            <p className="text-gray-900 dark:text-white font-bold mb-2">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AFRIKONI'S TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE SERVICE SHALL NOT EXCEED THE GREATER OF:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                                <li><strong>(A) $1,000 USD, OR</strong></li>
                                <li><strong>(B) THE TOTAL FEES PAID BY YOU TO AFRIKONI IN THE 12 MONTHS PRECEDING THE CLAIM</strong></li>
                            </ul>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9.3 Exclusion of Damages</h3>
                        <p className="text-gray-900 dark:text-white font-semibold mb-2">AFRIKONI SHALL NOT BE LIABLE FOR:</p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li>Indirect, incidental, special, consequential, or punitive damages</li>
                            <li>Loss of profits, revenue, data, or business opportunities</li>
                            <li>Damages arising from third-party conduct (buyers, sellers, logistics providers)</li>
                            <li>Damages from unauthorized access to your account</li>
                            <li>Damages from service interruptions or errors</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Contact Information</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            For questions about these Terms, contact us at:
                        </p>
                        <ul className="list-none text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Email:</strong> legal@afrikoni.com</li>
                            <li><strong>Support:</strong> support@afrikoni.com</li>
                        </ul>
                    </section>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-gray-600 dark:text-gray-400 italic">
                            By using Afrikoni, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Link
                            to="/legal/privacy"
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <FileText className="w-4 h-4" />
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
