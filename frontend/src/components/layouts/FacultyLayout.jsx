import React, { useState, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// ─── Nav items definition ──────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/faculty/dashboard',      icon: LayoutDashboard, label: 'Overview'    },
  { to: '/faculty/students',       icon: Users,           label: 'Manage Data' },
  { to: '/faculty/students/new',   icon: UserPlus,        label: 'Add Student' },
];

// ─── Sidebar content ───────────────────────────────────────────────────────────
function SidebarContent({ user, onLogout, onClose, isCollapsed, onToggleCollapse }) {
  const getInitials = (name = '') =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <div className="flex flex-col h-full">

      {/* ── Top Header with 3-Lines YouTube Hamburger ── */}
      <div className={`flex items-center px-4 pt-6 pb-5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          {/* YouTube-style 3-horizontal-lines hamburger icon */}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-md">
                <GraduationCap size={18} className="text-white" />
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">
                Faculty Portal
              </span>
            </div>
          )}
        </div>

        {/* Close button on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto text-white/50 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── User Card ── */}
      <div className={`mx-3 mb-5 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-semibold shadow">
          {getInitials(user?.full_name || user?.user_id)}
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.full_name ?? user?.user_id ?? 'Faculty'}
            </p>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold tracking-wide uppercase">
              Faculty
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 space-y-1.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            end={to === '/faculty/students'}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              [
                'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/20 text-white border border-purple-500/30 shadow-sm nav-link-active'
                  : 'text-white/60 hover:text-white hover:bg-white/8',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={
                    isActive
                      ? 'text-purple-400'
                      : 'text-white/50 group-hover:text-white transition-colors'
                  }
                />
                {!isCollapsed ? (
                  <>
                    <span>{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="faculty-active-pill"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                ) : (
                  /* YouTube-style hover tooltip when collapsed */
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 border border-white/15 text-white text-xs rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Logout ── */}
      <div className="p-3 mt-4">
        <button
          onClick={onLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group ${
            isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'
          }`}
        >
          <LogOut
            size={18}
            className="text-white/30 group-hover:text-red-400 transition-colors"
          />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

// ─── FacultyLayout ─────────────────────────────────────────────────────────────
export default function FacultyLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);

  return (
    <div className="min-h-screen flex bg-gray-950 text-white">

      {/* ══ Desktop Sidebar (YouTube style collapsible) ══ */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 bg-black/30 backdrop-blur-xl border-r border-white/10 min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent
          user={user}
          onLogout={handleLogout}
          onClose={null}
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      {/* ══ Mobile Overlay + Drawer ══ */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="faculty-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={closeDrawer}
            />
            {/* Drawer */}
            <motion.aside
              key="faculty-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-gray-900 border-r border-white/10 md:hidden"
            >
              <SidebarContent
                user={user}
                onLogout={handleLogout}
                onClose={closeDrawer}
                isCollapsed={false}
                onToggleCollapse={closeDrawer}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ Main content ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ══ Top Corner Header Bar (Desktop & Mobile) ══ */}
        <header className="flex items-center justify-between px-4 sm:px-8 py-3 bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Faculty Portal
              </span>
            </div>
          </div>

          {/* Top Right Corner — Faculty Identity & Animated Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="font-medium text-white/90 truncate max-w-[180px]">
                {user?.full_name || user?.user_id || 'Faculty Member'}
              </span>
            </div>

            <motion.button
              onClick={handleLogout}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239, 68, 68, 0.45)' }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 shadow-sm transition-all duration-200 cursor-pointer"
              title="Logout from account"
            >
              <LogOut size={15} className="text-red-400 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span>Logout</span>
            </motion.button>
          </div>
        </header>

        {/* Page content — AnimatePresence keyed by pathname for page transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
