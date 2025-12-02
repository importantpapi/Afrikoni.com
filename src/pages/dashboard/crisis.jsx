/**
 * Afrikoni Shield™ - Crisis Management Center
 * Phase 5: Real-time control tower for outages, cybersecurity, corruption, fraud,
 * logistics disruptions, political instability, PR threats, and emergency response
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, AlertTriangle, Shield, Power, DollarSign,
  Truck, Lock, Globe, Megaphone, Scale, CheckCircle, Clock, Filter,
  Search, Eye, ChevronDown, ChevronUp, Download, Send, FileText,
  Phone, Mail, Users, TrendingUp, Activity, XCircle, MapPin
} from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  crisisKPIs, activeIncidents, crisisCategories, situationMapData,
  crisisPlaybooks, escalationRules, emergencyContacts, communicationTemplates,
  recoveryTimelines
} from '@/data/crisisDemo';
import { isAdmin } from '@/utils/permissions';
import { supabase, supabaseHelpers } from '@/api/supabaseClient';
import { getCurrentUserAndRole } from '@/utils/authHelpers';
import AccessDenied from '@/components/AccessDenied';

export default function CrisisManagement() {
  // All hooks must be at the top - before any conditional returns
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [incidentFilter, setIncidentFilter] = useState({ category: 'all', severity: 'all' });
  const [incidentSearch, setIncidentSearch] = useState('');
  const [expandedPlaybooks, setExpandedPlaybooks] = useState(new Set());
  const [showCommModal, setShowCommModal] = useState(false);
  const [commType, setCommType] = useState('internal');

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { user: userData } = await getCurrentUserAndRole(supabase, supabaseHelpers);
      setUser(userData);
      setHasAccess(isAdmin(userData));
    } catch (error) {
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-afrikoni-text-dark/70">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasAccess) {
    return <AccessDenied />;
  }

  const filteredIncidents = activeIncidents.filter(incident => {
    if (incidentFilter.category !== 'all' && incident.category !== incidentFilter.category) return false;
    if (incidentFilter.severity !== 'all' && incident.severity !== incidentFilter.severity) return false;
    if (incidentSearch && !incident.description.toLowerCase().includes(incidentSearch.toLowerCase()) &&
        !incident.id.toLowerCase().includes(incidentSearch.toLowerCase())) return false;
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-50 text-red-700 border-red-200';
      case 'investigating': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'monitoring': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'bg-afrikoni-green/20 text-afrikoni-green border-afrikoni-green/30';
      case 'medium': return 'bg-afrikoni-gold/20 text-afrikoni-gold border-afrikoni-gold/30';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Outage': return Power;
      case 'Cybersecurity': return Shield;
      case 'Payments': return DollarSign;
      case 'Logistics': return Truck;
      case 'Fraud': return AlertTriangle;
      case 'Bribery/Corruption': return Lock;
      case 'Political Risk': return Globe;
      case 'PR Crisis': return Megaphone;
      case 'Legal Dispute': return Scale;
      default: return AlertCircle;
    }
  };

  const togglePlaybook = (id) => {
    const newExpanded = new Set(expandedPlaybooks);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPlaybooks(newExpanded);
  };

  // Situation Map Chart Data
  const mapChartData = situationMapData.map(country => ({
    country: country.country,
    riskScore: country.politicalRisk,
    disruptions: country.logisticsDisruptions + country.customsDelays + country.networkOutages
  }));

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-6">
        {/* Premium Header - v2.5 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/dashboard/risk" className="inline-flex items-center gap-2 text-afrikoni-gold hover:text-afrikoni-gold/80 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Risk Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-afrikoni-red" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-afrikoni-text-dark mb-2 leading-tight">
                Crisis Management Center
              </h1>
              <p className="text-afrikoni-text-dark/70 text-sm md:text-base leading-relaxed">
                Real-time emergency operations command center for incidents across 54 African countries
              </p>
            </div>
          </div>
        </motion.div>

        {/* Section A: Crisis Overview KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Crisis Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Active Incidents */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-red/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-afrikoni-red" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.activeIncidents}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Active Incidents
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Critical Severity Events */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.criticalSeverityEvents}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Critical Events
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Systems Operational */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-afrikoni-green" />
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Good
                    </Badge>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.systemsOperational}%
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Systems Operational
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Open Crisis Tasks */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-purple/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-afrikoni-purple" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.openCrisisTasks}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Open Tasks
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Average Response Time */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-afrikoni-gold" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.averageResponseTime}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Avg Response Time
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Resolved in Last 24h */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-afrikoni-green/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-afrikoni-green" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-afrikoni-text-dark mb-2">
                    {crisisKPIs.resolvedLast24h}
                  </div>
                  <div className="text-xs md:text-sm font-medium text-afrikoni-text-dark/70 uppercase tracking-wide">
                    Resolved (24h)
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Section B: Active Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3">
              Active Incidents
            </h2>
          </div>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              {/* Filters and Search */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-afrikoni-gold" />
                    <Input
                      placeholder="Search incidents..."
                      value={incidentSearch}
                      onChange={(e) => setIncidentSearch(e.target.value)}
                      className="pl-10 border-afrikoni-gold/30 focus:border-afrikoni-gold focus:ring-2 focus:ring-afrikoni-gold/20 rounded-afrikoni"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-afrikoni-text-dark/70" />
                  <select
                    value={incidentFilter.category}
                    onChange={(e) => setIncidentFilter({ ...incidentFilter, category: e.target.value })}
                    className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                  >
                    <option value="all">All Categories</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                    <option value="Logistics Disruption">Logistics Disruption</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Bribery/Corruption">Bribery/Corruption</option>
                    <option value="Political Risk">Political Risk</option>
                    <option value="Fraud Spike">Fraud Spike</option>
                  </select>
                  <select
                    value={incidentFilter.severity}
                    onChange={(e) => setIncidentFilter({ ...incidentFilter, severity: e.target.value })}
                    className="text-sm border border-afrikoni-gold/30 rounded-afrikoni px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Incidents Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-afrikoni-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Incident ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Severity</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Region / Country</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Last Update</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-afrikoni-text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="border-b border-afrikoni-gold/10 hover:bg-afrikoni-sand/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-afrikoni-text-dark">{incident.id}</td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">{incident.category}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`${
                              incident.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                              incident.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              incident.severity === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {incident.severity}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {incident.country} ({incident.region})
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-afrikoni-text-dark/70">
                          {new Date(incident.lastUpdate).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                            <Eye className="w-3 h-3 mr-1" />
                            Open Incident
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section C: Crisis Categories & Severity Levels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Crisis Categories & Severity Levels
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {crisisCategories.map((category) => {
              const Icon = getCategoryIcon(category.category);
              return (
                <Card key={category.category} className="border-afrikoni-gold/20 hover:border-afrikoni-gold/40 hover:shadow-premium-lg transition-all bg-white rounded-afrikoni-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-afrikoni-gold/20 rounded-full flex items-center justify-center">
                        <Icon className="w-5 h-5 text-afrikoni-gold" />
                      </div>
                      <h3 className="font-semibold text-afrikoni-text-dark">{category.category}</h3>
                    </div>
                    <p className="text-xs text-afrikoni-text-dark/70 mb-4">{category.description}</p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium text-red-600">Critical: </span>
                        <span className="text-afrikoni-text-dark/70">{category.critical}</span>
                      </div>
                      <div>
                        <span className="font-medium text-orange-600">High: </span>
                        <span className="text-afrikoni-text-dark/70">{category.high}</span>
                      </div>
                      <div>
                        <span className="font-medium text-yellow-600">Medium: </span>
                        <span className="text-afrikoni-text-dark/70">{category.medium}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-600">Low: </span>
                        <span className="text-afrikoni-text-dark/70">{category.low}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Section D: Real-Time Situation Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Real-Time Situation Map
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Regional Risk Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mapChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D8B5" />
                    <XAxis dataKey="country" stroke="#2E2A1F" fontSize={10} angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#2E2A1F" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FDF8F0',
                        border: '1px solid #D4A937',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="riskScore" fill="#D4A937" name="Risk Score" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="disruptions" fill="#E84855" name="Disruptions" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Country Risk Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {situationMapData.map((country, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-afrikoni-text-dark/50" />
                          <span className="font-medium text-afrikoni-text-dark">{country.country}</span>
                        </div>
                        <Badge className={getRiskLevelColor(country.riskLevel)}>
                          {country.riskLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-afrikoni-text-dark/70">
                        <div>Political Risk: {country.politicalRisk}</div>
                        <div>Logistics: {country.logisticsDisruptions}</div>
                        <div>Customs Delays: {country.customsDelays}</div>
                        <div>Network Outages: {country.networkOutages}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section E: Crisis Response Playbooks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Crisis Response Playbooks
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {crisisPlaybooks.map((playbook) => (
                  <div
                    key={playbook.id}
                    className="border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-colors"
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => togglePlaybook(playbook.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          playbook.severity === 'critical' ? 'bg-red-100' :
                          playbook.severity === 'high' ? 'bg-orange-100' :
                          'bg-yellow-100'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            playbook.severity === 'critical' ? 'text-red-600' :
                            playbook.severity === 'high' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-afrikoni-text-dark">{playbook.name}</h3>
                          <p className="text-xs text-afrikoni-text-dark/70">{playbook.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={`${
                            playbook.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                            playbook.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {playbook.severity}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-afrikoni-gold/30 rounded-afrikoni">
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </Button>
                        {expandedPlaybooks.has(playbook.id) ? (
                          <ChevronUp className="w-4 h-4 text-afrikoni-gold" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-afrikoni-gold" />
                        )}
                      </div>
                    </div>
                    {expandedPlaybooks.has(playbook.id) && (
                      <div className="px-4 pb-4 border-t border-afrikoni-gold/20 pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-afrikoni-text-dark mb-2">Step-by-Step Actions</h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-afrikoni-text-dark/70">
                              {playbook.steps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-afrikoni-text-dark mb-2">Required Teams</h4>
                              <div className="flex flex-wrap gap-2">
                                {playbook.requiredTeams.map((team, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {team}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-afrikoni-text-dark mb-2">Communications</h4>
                              <div className="flex flex-wrap gap-2">
                                {playbook.communications.map((comm, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {comm}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-afrikoni-text-dark mb-2">Expected Resolution</h4>
                              <p className="text-sm text-afrikoni-text-dark/70">{playbook.expectedResolution}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section F: Escalation Rules & Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Escalation Rules & Emergency Contacts
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Escalation Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {escalationRules.map((rule) => (
                    <div key={rule.level} className="p-4 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            rule.level === 1 ? 'bg-blue-500' :
                            rule.level === 2 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}>
                            {rule.level}
                          </div>
                          <div>
                            <h3 className="font-semibold text-afrikoni-text-dark">Level {rule.level}: {rule.name}</h3>
                            <p className="text-xs text-afrikoni-text-dark/70">Response Time: {rule.responseTime}</p>
                          </div>
                        </div>
                      </div>
                      {rule.threshold && (
                        <p className="text-xs text-afrikoni-text-dark/70 mb-2">Threshold: {rule.threshold}</p>
                      )}
                      <div className="text-xs text-afrikoni-text-dark/70 mb-2">
                        <span className="font-medium">Examples: </span>
                        {rule.examples.join(', ')}
                      </div>
                      <div className="text-xs text-afrikoni-text-dark/70">
                        <span className="font-medium">Contacts: </span>
                        {rule.contacts.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
              <CardHeader className="border-b border-afrikoni-gold/10 pb-4">
                <CardTitle className="text-base font-semibold">Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <h3 className="font-semibold text-afrikoni-text-dark mb-3">Internal</h3>
                    <div className="space-y-2">
                      {emergencyContacts.internal.map((contact, idx) => (
                        <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                          <div className="font-medium text-afrikoni-text-dark">{contact.name}</div>
                          <div className="text-xs text-afrikoni-text-dark/70 mb-1">{contact.role}</div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-afrikoni-text-dark mb-3">External Partners</h3>
                    <div className="space-y-2">
                      {emergencyContacts.external.map((contact, idx) => (
                        <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                          <div className="font-medium text-afrikoni-text-dark">{contact.name}</div>
                          <div className="text-xs text-afrikoni-text-dark/70 mb-1">{contact.firm}</div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-afrikoni-text-dark mb-3">Regulatory Bodies</h3>
                    <div className="space-y-2">
                      {emergencyContacts.regulatory.map((contact, idx) => (
                        <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                          <div className="font-medium text-afrikoni-text-dark">{contact.name}</div>
                          <div className="text-xs text-afrikoni-text-dark/70 mb-1">{contact.country}</div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-afrikoni-text-dark/70">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Section G: Communications Center */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Communications Center
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Internal Communications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-afrikoni-text-dark">Internal Communications</h3>
                    <Button
                      size="sm"
                      className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni"
                      onClick={() => {
                        setCommType('internal');
                        setShowCommModal(true);
                      }}
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Send Alert
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {communicationTemplates.internal.map((template, idx) => (
                      <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                        <div className="font-medium text-afrikoni-text-dark mb-1">{template.type}</div>
                        <p className="text-xs text-afrikoni-text-dark/70">{template.template}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Public Communications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-afrikoni-text-dark">Public Communications</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-afrikoni-gold/30 rounded-afrikoni"
                      onClick={() => {
                        setCommType('public');
                        setShowCommModal(true);
                      }}
                    >
                      <Megaphone className="w-3 h-3 mr-1" />
                      Prepare Statement
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {communicationTemplates.public.map((template, idx) => (
                      <div key={idx} className="p-3 border border-afrikoni-gold/20 rounded-afrikoni bg-afrikoni-ivory">
                        <div className="font-medium text-afrikoni-text-dark mb-1">{template.type}</div>
                        <p className="text-xs text-afrikoni-text-dark/70">{template.template}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section H: Recovery Timelines & SLA Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <h2 className="text-lg md:text-xl font-bold text-afrikoni-text-dark uppercase tracking-wider border-b-2 border-afrikoni-gold pb-3 mb-6">
            Recovery Timelines & SLA Tracker
          </h2>
          <Card className="border-afrikoni-gold/20 bg-white rounded-afrikoni-lg shadow-premium">
            <CardContent className="p-6">
              <div className="space-y-4">
                {recoveryTimelines.map((timeline) => (
                  <div
                    key={timeline.incidentId}
                    className="p-4 border border-afrikoni-gold/20 rounded-afrikoni hover:bg-afrikoni-sand/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-afrikoni-text-dark">{timeline.incidentName}</h3>
                        <p className="text-xs text-afrikoni-text-dark/70">{timeline.incidentId}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-afrikoni-text-dark/70 mb-1">SLA Target</div>
                        <div className="text-sm font-bold text-afrikoni-text-dark">{timeline.slaTarget}</div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-afrikoni-text-dark/70">Progress</span>
                        <span className="text-xs font-medium text-afrikoni-text-dark">{timeline.currentProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${timeline.currentProgress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-3 rounded-full ${
                            timeline.currentProgress < 30 ? 'bg-red-500' :
                            timeline.currentProgress < 60 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-afrikoni-text-dark/70">Team: </span>
                        <span className="text-afrikoni-text-dark">{timeline.teamAssigned}</span>
                      </div>
                      <div>
                        <span className="text-afrikoni-text-dark/70">ETA: </span>
                        <span className="text-afrikoni-text-dark">
                          {timeline.eta ? new Date(timeline.eta).toLocaleString() : 'TBD'}
                        </span>
                      </div>
                      {timeline.blockingIssues.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="text-afrikoni-text-dark/70">Blocking Issues: </span>
                          <span className="text-afrikoni-text-dark">{timeline.blockingIssues.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Communications Modal */}
      {showCommModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-afrikoni-lg shadow-premium-lg max-w-2xl w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-afrikoni-text-dark">
                {commType === 'internal' ? 'Send Internal Alert' : 'Prepare Public Statement'}
              </h3>
              <button onClick={() => setShowCommModal(false)} className="text-afrikoni-text-dark/70 hover:text-afrikoni-text-dark">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-afrikoni-text-dark mb-2 block">Template</label>
                <select className="w-full border border-afrikoni-gold/30 rounded-afrikoni px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20">
                  {commType === 'internal' ? (
                    <>
                      <option>Incident Alert</option>
                      <option>Task Assignment</option>
                      <option>Status Update</option>
                    </>
                  ) : (
                    <>
                      <option>Service Disruption</option>
                      <option>Security Incident</option>
                      <option>Logistics Delay</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-afrikoni-text-dark mb-2 block">Message</label>
                <textarea
                  className="w-full border border-afrikoni-gold/30 rounded-afrikoni px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-afrikoni-gold/20"
                  rows={6}
                  placeholder="Enter your message..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-afrikoni-gold hover:bg-afrikoni-gold/90 text-afrikoni-charcoal rounded-afrikoni">
                  <Send className="w-4 h-4 mr-2" />
                  {commType === 'internal' ? 'Send Alert' : 'Prepare Statement'}
                </Button>
                <Button variant="outline" onClick={() => setShowCommModal(false)} className="border-afrikoni-gold/30 rounded-afrikoni">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
