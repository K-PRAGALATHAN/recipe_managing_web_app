import React, { useEffect, useMemo, useState } from 'react';
import Layout from './layout';
import ChefPortal from './ChefPortal.jsx';
import CookPortal from './CookPortal.jsx';
import ManagerDashboard from './managerDashboard.jsx';
import SettingsPage from './SettingsPage.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', roles: ['Manager'] },
  { id: 'cook', roles: ['Manager'] },
  { id: 'recipes', roles: ['Manager', 'Chef', 'Cook'] },
  { id: 'inventory', roles: ['Manager'] },
  { id: 'settings', roles: ['Manager'] },
];

export default function App({ session, onLogout }) {
  const userRole = session?.role ?? 'Cook';

  const allowedNav = useMemo(
    () => NAV_ITEMS.filter((item) => item.roles.includes(userRole)).map((item) => item.id),
    [userRole],
  );

  const defaultNav = useMemo(() => (userRole === 'Manager' ? 'dashboard' : 'recipes'), [userRole]);

  const [activeNav, setActiveNav] = useState(() => {
    return allowedNav.includes(defaultNav) ? defaultNav : allowedNav[0] ?? 'recipes';
  });

  useEffect(() => {
    const fallback = allowedNav.includes(defaultNav) ? defaultNav : allowedNav[0] ?? 'recipes';
    setActiveNav((prev) => (allowedNav.includes(prev) ? prev : fallback));
  }, [allowedNav, defaultNav]);

  const renderContent = () => {
    if (activeNav === 'settings') return <SettingsPage session={session} />;

    if (userRole === 'Manager') {
      if (activeNav === 'cook') return <CookPortal />;
      if (activeNav === 'inventory') return <ManagerDashboard initialTab="inventory" title="Inventory" />;
      if (activeNav === 'recipes') return <ChefPortal />;
      return <ManagerDashboard initialTab="overview" title="Manager" />;
    }

    if (userRole === 'Chef') {
      return <ChefPortal />;
    }

    return <CookPortal />;
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
