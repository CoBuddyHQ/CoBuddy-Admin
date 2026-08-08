'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { hasPermission } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import { 
  ShieldCheck, Users, Activity, MessageSquare, AlertTriangle, 
  Ban, ShieldAlert, Star, RefreshCcw, Siren, MapPin, AlertCircle, 
  UserMinus, HeartPulse, DollarSign, Wallet, ArrowRightLeft, 
  Undo2, Shield, FileText, TrendingUp, RefreshCw, Radio, 
  Gavel, Clock, BookOpen, User, Ticket, Zap, LayoutGrid, 
  Map, Building2, TrendingDown, Database, GraduationCap, 
  Megaphone, Scale, Lock, FileSearch, Settings, Users2, 
  ClipboardList, PieChart, ChevronLeft, ChevronRight, Search,
  XCircle, Sliders, Calendar, Globe, Bell
} from 'lucide-react';

const MENU_GROUPS = [
  {
    title: 'VERIFICATION & TRUST',
    items: [
      { name: 'Verification Queue', path: '/verification', module: 'verification', icon: ShieldCheck },
      { name: 'Companion Applications', path: '/companion-applications', module: 'companion-applications', icon: Users },
      { name: 'Trust Score Engine', path: '/trust-score', module: 'trust-score', icon: Activity },
    ]
  },
  {
    title: 'MODERATION',
    items: [
      { name: 'Reports & Warnings', path: '/moderation/reports', module: 'reports', icon: AlertTriangle },
      { name: 'Bans & Suspensions', path: '/moderation/bans', module: 'bans', icon: Ban },
      { name: 'Flagged Chat Review', path: '/moderation/flagged-chats', module: 'flagged-chats', icon: MessageSquare },
      { name: 'Chat Settings', path: '/moderation/chat-settings', module: 'chat-settings', icon: MessageSquare },
      { name: 'Risk Scoring', path: '/moderation/risk-scoring', module: 'risk-scoring', icon: ShieldAlert },
      { name: 'Reviews Moderation', path: '/moderation/reviews', module: 'reviews', icon: Star },
      { name: 'Appeals', path: '/moderation/appeals', module: 'appeals', icon: RefreshCcw },
    ]
  },
  {
    title: 'SAFETY OPERATIONS',
    items: [
      { name: 'Live SOS Dashboard', path: '/safety/sos-dashboard', module: 'sos-dashboard', icon: Siren },
      { name: 'Geofence Alerts', path: '/safety/geofence', module: 'geofence', icon: MapPin },
      { name: 'Incident Center', path: '/safety/incidents', module: 'incidents', icon: AlertCircle },
      { name: 'Age/Minor Escalations', path: '/safety/age-escalation', module: 'age-escalation', icon: UserMinus },
      { name: 'Emergency Workflow', path: '/safety/emergency-workflow', module: 'emergency-workflow', icon: HeartPulse },
    ]
  },
  {
    title: 'OPERATIONS & BOOKING',
    items: [
      { name: 'Live Booking Map', path: '/operations/live-map', module: 'live-map', icon: Map },
      { name: 'Active Sessions', path: '/operations/active-sessions', module: 'active-sessions', icon: Radio },
      { name: 'Completed Bookings', path: '/operations/completed-bookings', module: 'completed-bookings', icon: Clock },
      { name: 'Failed / Cancelled', path: '/operations/cancelled-bookings', module: 'cancelled-bookings', icon: XCircle },
      { name: 'Search & Matchmaking', path: '/operations/matchmaking', module: 'matchmaking', icon: Sliders },
    ]
  },
  {
    title: 'FINANCIAL',
    items: [
      { name: 'Commission & Pricing', path: '/system/config', module: 'config', icon: DollarSign },
      { name: 'Escrow / Wallets', path: '/financial/escrow', module: 'escrow', icon: Wallet },
      { name: 'Payouts', path: '/financial/payouts', module: 'payouts', icon: ArrowRightLeft },
      { name: 'Refunds & Disputes', path: '/financial/refunds', module: 'refunds', icon: Undo2 },
      { name: 'Booking Disputes', path: '/bookings/disputes', module: 'booking-disputes', icon: Scale },
      { name: 'Fraud Detection', path: '/financial/fraud-detection', module: 'fraud-detection', icon: Shield },
      { name: 'Tax / Invoices', path: '/financial/tax-invoices', module: 'tax-invoices', icon: FileText },
      { name: 'Revenue Reports', path: '/financial/revenue-reports', module: 'revenue-reports', icon: TrendingUp },
      { name: 'Payment Reconciliation', path: '/financial/reconciliation', module: 'reconciliation', icon: RefreshCw },
    ]
  },
  {
    title: 'BOOKINGS & USERS',
    items: [
      { name: 'Live Sessions', path: '/safety/live-sessions', module: 'live-sessions', icon: Radio },
      { name: 'Session Audit Logs', path: '/operations/session-audit', module: 'session-audit', icon: ClipboardList },
      { name: 'Customer Directory', path: '/customers', module: 'customers', icon: Users },
      { name: 'Companion Directory', path: '/companions', module: 'companions', icon: UserMinus },
    ]
  },
  {
    title: 'SUPPORT',
    items: [
      { name: 'Tickets', path: '/support/tickets', module: 'tickets', icon: MessageSquare },
      { name: 'SLA Dashboard', path: '/support/sla-dashboard', module: 'sla-dashboard', icon: Activity },
    ]
  },
  {
    title: 'DISCOVERY & OPS',
    items: [
      { name: 'Discovery Config', path: '/discovery/ranking-config', module: 'ranking-config', icon: LayoutGrid },
      { name: 'Special Events', path: '/discovery/events', module: 'events', icon: Calendar },
      { name: 'City Launch Management', path: '/operations/city-launch', module: 'city-launch', icon: Map },
      { name: 'Venue Management', path: '/operations/venues', module: 'venues', icon: Building2 },
      { name: 'Growth Abuse Monitoring', path: '/operations/growth-abuse', module: 'growth-abuse', icon: TrendingDown },
    ]
  },
  {
    title: 'PLATFORM CONFIG',
    items: [
      { name: 'Master Data Management', path: '/system/master-data', module: 'master-data', icon: Database },
      { name: 'Training & Content', path: '/platform-config/training', module: 'training', icon: GraduationCap },
      { name: 'Announcements', path: '/marketing/notifications', module: 'notifications', icon: Megaphone },
      { name: 'Policy & Legal Docs', path: '/platform-config/policy-docs', module: 'policy-docs', icon: Scale },
    ]
  },
  {
    title: 'PRIVACY & COMPLIANCE',
    items: [
      { name: 'Data Privacy Requests', path: '/legal/data-privacy', module: 'data-privacy', icon: ShieldCheck },
      { name: 'Legal Requests', path: '/legal/legal-requests', module: 'legal-requests', icon: Scale },
    ]
  },
  {
    title: 'ANALYTICS',
    items: [
      { name: 'User Growth', path: '/analytics/growth', module: 'growth', icon: TrendingUp },
      { name: 'Market Performance', path: '/analytics/market', module: 'market', icon: PieChart },
      { name: 'Session Metrics', path: '/analytics/sessions', module: 'sessions', icon: Activity },
    ]
  },
  {
    title: 'SYSTEM & CONFIG',
    items: [
      { name: 'Audit Logs', path: '/system/audit-logs', module: 'audit-logs', icon: ClipboardList },
      { name: 'Dynamic App Configs', path: '/system/app-configs', module: 'app-configs', icon: Settings },
      { name: 'Employee Mgmt', path: '/system/employees', module: 'employees', icon: Users2 },
      { name: 'Roles & Permissions', path: '/system/employees/roles', module: 'employee-roles', icon: ShieldCheck }
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  if (!user) return null;

  return (
    <div className={cn(
      "flex flex-col border-r bg-card transition-all duration-300 relative h-full flex-shrink-0 z-10",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center justify-between px-4 border-b">
        {!sidebarCollapsed && <span className="font-bold text-lg">CoBuddy Admin</span>}
        {sidebarCollapsed && <span className="font-bold text-lg mx-auto">CB</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {MENU_GROUPS.map((group, i) => {
          const visibleItems = group.items.filter(item => hasPermission(user.roles, item.module));
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={i} className="mb-6 px-2">
              {!sidebarCollapsed && (
                <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        sidebarCollapsed && "justify-center"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:bg-accent"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </div>
  );
}
