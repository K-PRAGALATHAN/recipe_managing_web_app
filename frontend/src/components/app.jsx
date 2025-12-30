import React, { useEffect, useMemo, useState } from 'react';
import Layout from './layout';
import ChefPortal from './ChefPortal.jsx';
import CookPortal from './CookPortal.jsx';
import ManagerDashboard from './managerDashboard.jsx';
import SettingsPage from './SettingsPage.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', roles: ['Manager'] },
  { id: 'cook', roles: ['Manager', 'Chef', 'Cook'] },
  { id: 'recipes', roles: ['Manager', 'Chef'] },
  { id: 'inventory', roles: ['Manager'] },
  { id: 'settings', roles: ['Manager'] },
];

export default function App({ session, onLogout }) {
  const userRole = session?.role ?? 'Cook';

  const allowedNav = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(userRole)).map((item) => item.id),
    [userRole],
  );

  const defaultNav = useMemo(() => {
    if (userRole === 'Manager') return 'dashboard';
    if (userRole === 'Chef') return 'recipes';
    return 'cook';
  }, [userRole]);

  const [activeNav, setActiveNav] = useState(() => {
    return allowedNav.includes(defaultNav) ? defaultNav : allowedNav[0] ?? 'recipes';
  });

  useEffect(() => {
    const fallback = allowedNav.includes(defaultNav) ? defaultNav : allowedNav[0] ?? 'recipes';
    setActiveNav((prev) => (allowedNav.includes(prev) ? prev : fallback));
  }, [allowedNav, defaultNav]);

  const renderContent = () => {
    if (activeNav === 'settings') return <SettingsPage session={session} />;
    if (activeNav === 'cook') return <CookPortal />;
    if (activeNav === 'recipes') return <ChefPortal />;

    if (userRole === 'Manager') {
      if (activeNav === 'inventory') return <ManagerDashboard initialTab="inventory" title="Inventory" />;
      return <ManagerDashboard initialTab="overview" title="Manager" />;
    }

    return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-200">Not available.</div>;
  };

  return (
    <Layout
      userRole={userRole}
      userEmail={session?.email}
      onLogout={onLogout}
      activeNav={activeNav}
      onNavigate={setActiveNav}
    >
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {renderContent()}
      </div>
    </Layout>
  );
}
