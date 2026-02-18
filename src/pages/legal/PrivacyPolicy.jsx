import { Shield, Scale, ArrowLeft, Lock, Eye, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {

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
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Privacy Policy
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            Afrikoni ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our B2B trade platform.
                        </p>
                        <p className="text-gray-900 dark:text-white font-semibold mt-4">
                            By using Afrikoni, you consent to the data practices described in this policy.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            2. Information We Collect
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.1 Information You Provide</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mb-4">
                            <li><strong>Account Information:</strong> Name, email, phone number, company name, job title</li>
                            <li><strong>Business Information:</strong> Company registration details, tax ID, business address</li>
                            <li><strong>Verification Documents:</strong> KYC/KYB documents (ID cards, business licenses)</li>
                            <li><strong>Transaction Data:</strong> RFQs, quotes, orders, payment information, shipping details</li>
                            <li><strong>Communications:</strong> Messages, support tickets, feedback</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2.2 Automatically Collected Information</h3>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                            <li><strong>Device Information:</strong> IP address, browser type, operating system, device ID</li>
                            <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                            <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
                        </ul>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            3. How We Use Your Information
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">We use your information to:</p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Provide Services:</strong> Facilitate trades, process transactions, manage accounts</li>
                            <li><strong>Verify Users:</strong> Conduct KYC/KYB checks, prevent fraud</li>
                            <li><strong>Communicate:</strong> Send transactional emails, notifications, support responses</li>
                            <li><strong>Improve Platform:</strong> Analyze usage, develop features, fix bugs</li>
                            <li><strong>Marketing:</strong> Send promotional emails (with your consent, opt-out available)</li>
                            <li><strong>Compliance:</strong> Meet legal obligations, enforce Terms of Service</li>
                            <li><strong>Security:</strong> Detect fraud, prevent unauthorized access, protect users</li>
                        </ul>
                    </section>

                    <section className="mb-8 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-6 rounded-r-lg">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Your Data Rights</h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.1 Access and Portability</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    You can access your personal data through your account settings and request a copy in a portable format.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.2 Correction</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    You can update your information in account settings or contact us to correct inaccurate data.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.3 Deletion</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    You can request account deletion (subject to legal retention requirements).
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">7.4 Objection and Restriction</h3>
                                <p className="text-gray-700 dark:text-gray-300">
                                    You can object to processing for marketing purposes and request restriction in certain circumstances.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mt-4">
                                <p className="text-gray-900 dark:text-white font-semibold">
                                    To exercise your rights, contact us at: <a href="mailto:privacy@afrikoni.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@afrikoni.com</a>
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                            8. Data Security
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            We implement reasonable technical and organizational measures to protect your data:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Encryption:</strong> Data in transit (TLS/SSL) and at rest</li>
                            <li><strong>Access Controls:</strong> Role-based access, authentication</li>
                            <li><strong>Monitoring:</strong> Security logging, intrusion detection</li>
                            <li><strong>Audits:</strong> Regular security assessments</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-400 italic mt-4">
                            However, no system is 100% secure. We cannot guarantee absolute security.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Contact Us</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            For privacy-related questions or to exercise your data rights:
                        </p>
                        <ul className="list-none text-gray-700 dark:text-gray-300 space-y-2">
                            <li><strong>Email:</strong> privacy@afrikoni.com</li>
                            <li><strong>Data Protection Officer:</strong> dpo@afrikoni.com</li>
                            <li><strong>Support:</strong> support@afrikoni.com</li>
                        </ul>
                    </section>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-gray-600 dark:text-gray-400 italic">
                            By using Afrikoni, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center gap-4">
                        <Link
                            to="/legal/terms"
                            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            <Scale className="w-4 h-4" />
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
