import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Mail, Phone, Building2, CreditCard, Shield, Lock, FileText, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const verificationSteps = [
  {
    id: 'email',
    label: 'Email Verification',
    icon: Mail,
    description: 'Verify your email address',
    completed: true,
    required: true
  },
  {
    id: 'phone',
    label: 'Phone Verification',
    icon: Phone,
    description: 'Verify your phone number',
    completed: true,
    required: true
  },
  {
    id: 'business',
    label: 'Business Registration',
    icon: Building2,
    description: 'Upload business registration documents',
    completed: true,
    required: true
  },
  {
    id: 'kyc',
    label: 'ID / KYC Verification',
    icon: CreditCard,
    description: 'Upload government-issued ID',
    completed: false,
    required: true
  },
  {
    id: 'bank',
    label: 'Bank Account Verification',
    icon: CreditCard,
    description: 'Verify your bank account details',
    completed: false,
    required: true
  },
  {
    id: 'trade',
    label: 'Trade Assurance',
    icon: Shield,
    description: 'Enable trade protection features',
    completed: false,
    required: false
  }
];

export default function VerificationCenter() {
  const completedCount = verificationSteps.filter(s => s.completed).length;
  const requiredCompleted = verificationSteps.filter(s => s.required && s.completed).length;
  const requiredTotal = verificationSteps.filter(s => s.required).length;
  const profileCompleteness = Math.round((completedCount / verificationSteps.length) * 100);
  const verificationProgress = Math.round((requiredCompleted / requiredTotal) * 100);

  return (
    <div className="min-h-screen bg-afrikoni-offwhite py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-chestnut mb-3">Verification Center</h1>
          <p className="text-lg text-afrikoni-deep">
            Complete your profile to unlock all Afrikoni features and build trust with partners
          </p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-afrikoni-gold" />
                Profile Completeness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-afrikoni-chestnut">{profileCompleteness}%</span>
                  <span className="text-xs text-afrikoni-deep/70">{completedCount} of {verificationSteps.length} completed</span>
                </div>
                <Progress value={profileCompleteness} className="h-3" />
              </div>
              <p className="text-sm text-afrikoni-deep">
                Complete all steps to maximize your account benefits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-600" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-afrikoni-chestnut">{verificationProgress}%</span>
                  <span className="text-xs text-afrikoni-deep/70">{requiredCompleted} of {requiredTotal} required</span>
                </div>
                <Progress value={verificationProgress} className="h-3" />
              </div>
              {verificationProgress === 100 ? (
                <Badge variant="success" className="text-xs">✓ Fully Verified</Badge>
              ) : (
                <Badge variant="warning" className="text-xs">Verification In Progress</Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Verification Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationSteps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * idx }}
                    >
                      <div className={`
                        flex items-center gap-4 p-4 rounded-lg border-2 transition-all
                        ${step.completed 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-afrikoni-gold/20 bg-afrikoni-offwhite hover:border-afrikoni-gold200 hover:bg-afrikoni-offwhite'
                        }
                      `}>
                        <div className={`
                          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                          ${step.completed 
                            ? 'bg-green-100' 
                            : 'bg-afrikoni-cream'
                          }
                        `}>
                          {step.completed ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Icon className={`w-6 h-6 ${step.required ? 'text-afrikoni-gold' : 'text-afrikoni-deep/70'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-afrikoni-chestnut">{step.label}</h3>
                            {step.required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                            {step.completed && (
                              <Badge variant="success" className="text-xs">✓ Verified</Badge>
                            )}
                          </div>
                          <p className="text-sm text-afrikoni-deep">{step.description}</p>
                        </div>
                        <div>
                          {step.completed ? (
                            <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                              <CheckCircle className="w-4 h-4" />
                              <span>Done</span>
                            </div>
                          ) : (
                            <Button variant="primary" size="sm">
                              {step.id === 'email' || step.id === 'phone' ? 'Verify' : 'Upload'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-afrikoni-gold200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-afrikoni-gold" />
                Benefits of Full Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Access to premium features',
                  'Higher trust score with partners',
                  'Priority customer support',
                  'Trade protection enabled',
                  'Verified badge on profile',
                  'Increased order limits'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-afrikoni-deep">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

