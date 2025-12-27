import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Database, Shield, Users, Layout, GitBranch, Settings } from 'lucide-react';

const AfrikoniArchitecture = () => {
  const [activeView, setActiveView] = useState('boot');
  const [expandedSections, setExpandedSections] = useState({
    auth: true,
    role: true,
    dashboard: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
  };

  const views = [
    { id: 'boot', label: 'Boot Flow', icon: GitBranch },
    { id: 'auth', label: 'Auth & Identity', icon: Shield },
    { id: 'routing', label: 'Routing Map', icon: Layout },
    { id: 'role', label: 'Role System', icon: Users },
    { id: 'data', label: 'Data Layer', icon: Database },
    { id: 'risks', label: 'Risk Zones', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-emerald-600">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Afrikoni Marketplace</h1>
              <p className="text-slate-600 text-lg">B2B Platform - System Architecture & Runtime Behavior</p>
              <div className="flex gap-4 mt-4">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">React 18.2.0</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">Supabase</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">Vite 5.0.8</span>
              </div>
            </div>
            <Settings className="text-slate-400" size={32} />
          </div>
        </div>

        {/* View Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {views.map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeView === view.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeView === 'boot' && <BootFlow />}
          {activeView === 'auth' && <AuthFlow />}
          {activeView === 'routing' && <RoutingMap />}
          {activeView === 'role' && <RoleSystem />}
          {activeView === 'data' && <DataLayer />}
          {activeView === 'risks' && <RiskZones />}
        </div>
      </div>
    </div>
  );
};

const BootFlow = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <GitBranch className="text-emerald-600" />
      Application Boot Sequence
    </h2>
    
    <div className="space-y-4">
      {[
        {
          step: '1',
          title: 'React DOM Initialization',
          details: 'main.jsx → Renders <App /> in ErrorBoundary + BrowserRouter',
          color: 'blue'
        },
        {
          step: '2',
          title: 'Global Services Init',
          details: 'Sentry error tracking, GA4 analytics (fail silently if not configured)',
          color: 'purple'
        },
        {
          step: '3',
          title: 'Context Providers Mount',
          details: 'LanguageProvider → CurrencyProvider → RoleProvider → UserProvider wrap entire app',
          color: 'emerald'
        },
        {
          step: '4',
          title: 'Session Restoration',
          details: 'useSessionRefresh calls supabase.auth.getSession() to check localStorage',
          color: 'amber'
        },
        {
          step: '5',
          title: 'Route Resolution',
          details: 'React Router evaluates current path → Renders matching route component',
          color: 'rose'
        },
        {
          step: '6',
          title: 'ProtectedRoute Check',
          details: 'If authenticated route → Checks session → Redirects to /login if no session',
          color: 'indigo'
        },
        {
          step: '7',
          title: 'Data Fetching Phase',
          details: 'Component useEffect hooks fire → Fetch profile, company, role-specific data',
          color: 'teal'
        }
      ].map(item => (
        <div key={item.step} className={`border-l-4 border-${item.color}-500 bg-${item.color}-50 p-4 rounded-r-lg`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full bg-${item.color}-500 text-white flex items-center justify-center font-bold flex-shrink-0`}>
              {item.step}
            </div>
            <div>
              <h3 className={`font-bold text-${item.color}-900 mb-1`}>{item.title}</h3>
              <p className={`text-${item.color}-700 text-sm`}>{item.details}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Critical Timing</h3>
          <p className="text-amber-700 text-sm">Session check happens BEFORE profile fetch. If session exists but profile missing, PostLoginRouter self-heals by creating profile with defaults (role: 'buyer', onboarding_completed: false).</p>
        </div>
      </div>
    </div>
  </div>
);

const AuthFlow = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <Shield className="text-emerald-600" />
      Authentication & Identity Model
    </h2>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-bold text-blue-900 mb-3">Signup Flow</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2"><span className="font-bold">1.</span> User submits email/password</li>
          <li className="flex gap-2"><span className="font-bold">2.</span> supabase.auth.signUp() creates auth.users record</li>
          <li className="flex gap-2"><span className="font-bold">3.</span> Poll for session (10 retries, 200ms intervals)</li>
          <li className="flex gap-2"><span className="font-bold">4.</span> On session → Navigate to /auth/post-login</li>
          <li className="flex gap-2"><span className="font-bold">5.</span> PostLoginRouter self-heals missing profile</li>
        </ol>
      </div>

      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <h3 className="font-bold text-emerald-900 mb-3">Login Flow</h3>
        <ol className="space-y-2 text-sm text-emerald-800">
          <li className="flex gap-2"><span className="font-bold">1.</span> User submits email/password</li>
          <li className="flex gap-2"><span className="font-bold">2.</span> supabase.auth.signInWithPassword()</li>
          <li className="flex gap-2"><span className="font-bold">3.</span> On success → Session stored in localStorage</li>
          <li className="flex gap-2"><span className="font-bold">4.</span> Navigate to /auth/post-login</li>
          <li className="flex gap-2"><span className="font-bold">5.</span> PostLoginRouter routes to role dashboard</li>
        </ol>
      </div>
    </div>

    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
      <h3 className="font-bold text-purple-900 mb-3">Identity Data Sources (Priority Order)</h3>
      <div className="grid md:grid-cols-3 gap-4 mt-3">
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="font-bold text-purple-900 mb-2">auth.users</div>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• id (UUID)</li>
            <li>• email</li>
            <li>• email_confirmed_at</li>
            <li>• user_metadata.full_name</li>
          </ul>
        </div>
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="font-bold text-purple-900 mb-2">profiles</div>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• role (authoritative)</li>
            <li>• company_id</li>
            <li>• onboarding_completed</li>
            <li>• is_admin</li>
          </ul>
        </div>
        <div className="bg-white rounded p-3 border border-purple-200">
          <div className="font-bold text-purple-900 mb-2">Session</div>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• Stored in localStorage</li>
            <li>• Auto-refresh enabled</li>
            <li>• Expires after 1 hour</li>
            <li>• Monitored every 30min</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-rose-600 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-rose-900 mb-1">Critical Invariant</h3>
          <p className="text-rose-700 text-sm">profiles.id MUST equal auth.users.id (enforced by foreign key). Profile self-healing uses upsert with onConflict: 'id' to prevent race conditions during concurrent signups.</p>
        </div>
      </div>
    </div>
  </div>
);

const RoutingMap = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <Layout className="text-emerald-600" />
      Routing Architecture
    </h2>

    <div className="space-y-4">
      <div className="border-2 border-slate-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-3">Public Routes (No Auth)</h3>
        <div className="grid md:grid-cols-3 gap-2 text-sm">
          {['/', '/login', '/signup', '/products', '/suppliers', '/marketplace', '/about', '/contact', '/pricing'].map(route => (
            <div key={route} className="bg-slate-100 px-3 py-2 rounded font-mono text-slate-700">
              {route}
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <h3 className="font-bold text-emerald-900 mb-3">Dashboard Entry Points (Auth Required)</h3>
        <div className="space-y-3">
          {[
            { path: '/dashboard/buyer', role: 'buyer, hybrid', desc: 'Orders, RFQs, Payments' },
            { path: '/dashboard/seller', role: 'seller, hybrid', desc: 'Products, Sales, Analytics' },
            { path: '/dashboard/hybrid', role: 'hybrid', desc: 'Combined buyer + seller views' },
            { path: '/dashboard/logistics', role: 'logistics', desc: 'Shipments, Fulfillment' },
            { path: '/dashboard/admin', role: 'admin', desc: 'User mgmt, Analytics, Approvals' }
          ].map(item => (
            <div key={item.path} className="bg-white rounded p-3 border border-emerald-300">
              <div className="flex justify-between items-start">
                <code className="font-bold text-emerald-900">{item.path}</code>
                <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-1 rounded">{item.role}</span>
              </div>
              <p className="text-sm text-emerald-700 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
        <h3 className="font-bold text-amber-900 mb-3">Route Guards</h3>
        <div className="space-y-3">
          <div className="bg-white rounded p-3 border border-amber-300">
            <h4 className="font-bold text-amber-900 mb-2">ProtectedRoute</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Checks: requireAuth() → session validity</li>
              <li>• requireOnboarding prop exists but NOT enforced</li>
              <li>• requireAdmin prop → checks isAdmin() function</li>
              <li>• Redirects to /login?next={'{currentPath}'} if not authenticated</li>
            </ul>
          </div>
          <div className="bg-white rounded p-3 border border-amber-300">
            <h4 className="font-bold text-amber-900 mb-2">RequireDashboardRole</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Uses DashboardRoleContext (URL-derived role)</li>
              <li>• Normalizes logistics_partner → logistics</li>
              <li>• Silent redirect if role not in allow array</li>
              <li>• No error messages, just redirects to user's home</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RoleSystem = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <Users className="text-emerald-600" />
      Role & Permission Model
    </h2>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-bold text-blue-900 mb-3">Role Sources (Priority Order)</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <div>
              <strong>URL Path</strong> (DashboardRoleContext)
              <div className="text-xs mt-1">Primary for dashboard pages, derived from /dashboard/{'{role}'}</div>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <div>
              <strong>profiles.role</strong>
              <div className="text-xs mt-1">Authoritative source for user's actual role</div>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <div>
              <strong>profiles.user_role</strong>
              <div className="text-xs mt-1">Legacy field, used as fallback</div>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <div>
              <strong>Default: 'buyer'</strong>
              <div className="text-xs mt-1">If no role found anywhere</div>
            </div>
          </li>
        </ol>
      </div>

      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <h3 className="font-bold text-emerald-900 mb-3">Role Normalization</h3>
        <div className="bg-white rounded p-3 border border-emerald-300 mb-3">
          <code className="text-sm text-emerald-900">logistics_partner → logistics</code>
        </div>
        <p className="text-sm text-emerald-700 mb-2">Occurs in:</p>
        <ul className="text-xs text-emerald-600 space-y-1">
          <li>• roleHelpers.js - getUserRole()</li>
          <li>• RoleContext.tsx - normalizeRole()</li>
          <li>• DashboardRoleContext.tsx</li>
          <li>• RequireDashboardRole.tsx</li>
          <li>• Dashboard component</li>
          <li>• PostLoginRouter</li>
          <li>• DashboardLayout (dev switcher)</li>
        </ul>
      </div>
    </div>

    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
      <h3 className="font-bold text-purple-900 mb-3">Supported Roles & Access</h3>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { role: 'buyer', access: ['Orders', 'RFQs', 'Payments', 'Saved Products'] },
          { role: 'seller', access: ['Products', 'Sales', 'Analytics', 'Fulfillment'] },
          { role: 'hybrid', access: ['Buyer Routes', 'Seller Routes', 'Combined Views'] },
          { role: 'logistics', access: ['Shipments', 'Quotes', 'Fulfillment'] },
          { role: 'admin', access: ['All Users', 'Analytics', 'Approvals', 'Risk Management'] }
        ].map(item => (
          <div key={item.role} className="bg-white rounded p-3 border border-purple-300">
            <div className="font-bold text-purple-900 mb-2 capitalize">{item.role}</div>
            <ul className="text-xs text-purple-700 space-y-1">
              {item.access.map(a => <li key={a}>• {a}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Founder Special Privileges</h3>
          <p className="text-amber-700 text-sm mb-2">Email: youba.thiam@icloud.com</p>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Always treated as admin (bypasses is_admin flag)</li>
            <li>• Can use dev role switcher in production</li>
            <li>• Can access any dashboard regardless of profile role</li>
            <li>• Admin panel link visible from any role dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const DataLayer = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <Database className="text-emerald-600" />
      Data Access Layer
    </h2>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
        <h3 className="font-bold text-blue-900 mb-3">Supabase Client Config</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li><strong>persistSession:</strong> true (localStorage)</li>
          <li><strong>autoRefreshToken:</strong> true</li>
          <li><strong>detectSessionInUrl:</strong> true (OAuth)</li>
          <li><strong>Storage Key:</strong> sb-{'{project-id}'}-auth-token</li>
        </ul>
      </div>

      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <h3 className="font-bold text-emerald-900 mb-3">Query Patterns</h3>
        <ul className="text-sm text-emerald-800 space-y-2">
          <li>• Direct queries: supabase.from('table').select()</li>
          <li>• Filter by user_id or company_id</li>
          <li>• No centralized query layer</li>
          <li>• Each component fetches independently</li>
          <li>• No client-side caching</li>
        </ul>
      </div>
    </div>

    <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
      <h3 className="font-bold text-purple-900 mb-3">RLS Assumptions</h3>
      <ul className="text-sm text-purple-800 space-y-2">
        <li>• All tables have RLS enabled</li>
        <li>• Queries filter by user_id or company_id to match RLS</li>
        <li>• Users only see their own data</li>
        <li>• Companies isolated by owner_email or company_id</li>
        <li>• Admin queries may bypass RLS (service role assumed)</li>
      </ul>
    </div>

    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-rose-600 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-rose-900 mb-2">Known Performance Issues</h3>
          <div className="space-y-2 text-sm text-rose-700">
            <div>
              <strong>Auth RLS InitPlan (12 warnings):</strong>
              <p>Multiple policies re-evaluate auth.uid() per row instead of once per query. Fix: Replace auth.uid() with (select auth.uid()).</p>
            </div>
            <div>
              <strong>Multiple Permissive Policies (28 warnings):</strong>
              <p>Tables have overlapping policies requiring PostgreSQL to evaluate all. Fix: Consolidate into single policies with OR/AND logic.</p>
            </div>
            <p className="text-rose-600 font-medium">Impact: Performance degrades at scale. Not functional errors.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RiskZones = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
      <AlertTriangle className="text-rose-600" />
      Risk Zones & Update Safety
    </h2>

    <div className="space-y-4">
      <div className="border-2 border-rose-200 rounded-lg p-4 bg-rose-50">
        <h3 className="font-bold text-rose-900 mb-3">⛔ DO NOT TOUCH (Without Full Regression Testing)</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { file: 'supabaseClient.js', reason: 'Session config - breaks all auth' },
            { file: 'authHelpers.js', reason: 'Core auth functions' },
            { file: 'PostLoginRouter.jsx', reason: 'Post-login routing logic' },
            { file: 'roleHelpers.js', reason: 'Role normalization' },
            { file: 'permissions.js', reason: 'Admin check - founder hardcoding' },
            { file: 'Dashboard/index.jsx', reason: 'Role verification logic' },
            { file: 'ProtectedRoute.jsx', reason: 'Route guards' },
            { file: 'RequireDashboardRole.tsx', reason: 'Role access guards' }
          ].map(item => (
            <div key={item.file} className="bg-white rounded p-3 border border-rose-300">
              <code className="text-sm font-bold text-rose-900">{item.file}</code>
              <p className="text-xs text-rose-700 mt-1">{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50">
        <h3 className="font-bold text-amber-900 mb-3">⚠️ Requires Caution</h3>
        <ul className="text-sm text-amber-800 space-y-2">
          <li><strong>Auth Flow:</strong> Signup/login logic, profile creation, OAuth callbacks</li>
          <li><strong>Role System:</strong> Role checks, normalization, hybrid access</li>
          <li><strong>Dashboard Routing:</strong> Role verification, redirects, onboarding</li>
          <li><strong>Data Queries:</strong> Supabase filters, RLS assumptions, company_id deps</li>
        </ul>
      </div>

      <div className="border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50">
        <h3 className="font-bold text-emerald-900 mb-3">✅ Safe to Update</h3>
        <ul className="text-sm text-emerald-800 space-y-2">
          <li><strong>UI/UX:</strong> Styling, layouts, spacing, colors, fonts</li>
          <li><strong>Content:</strong> Help pages, about, legal, footer links</li>
          <li><strong>Config:</strong> Navigation menus, translations, design tokens</li>
          <li><strong>Non-critical features:</strong> Analytics, tooltips, loading states</li>
        </ul>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Timing-Sensitive Logic</h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li><strong>Session Creation → Redirect:</strong> Polls 10x at 200ms intervals for session after signup</li>
              <li><strong>Dev Role Switcher:</strong> 100ms delay after DB update before navigation (prevents race)</li>
              <li><strong>Profile Fetch:</strong> Uses upsert() to handle concurrent creation races</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AfrikoniArchitecture;
