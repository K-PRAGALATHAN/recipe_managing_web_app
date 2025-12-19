import React, { useEffect, useState } from 'react';
import Layout from './layout';
import ChefPortal from './ChefPortal.jsx';
import CookPortal from './CookPortal.jsx';
import ManagerDashboard from './managerDashboard.jsx';

const VIEWS_BY_ROLE = {
  Manager: ['Manager', 'Chef', 'Cook'],
  Chef: ['Chef', 'Cook'],
  Cook: ['Cook'],
};

export default function App({ session, onLogout }) {
  const allowedViews = VIEWS_BY_ROLE[session?.role] ?? ['Cook'];
  const [activeView, setActiveView] = useState(session?.role ?? 'Cook');

  useEffect(() => {
    const fallback = session?.role ?? 'Cook';
    setActiveView((prev) => (allowedViews.includes(prev) ? prev : fallback));
  }, [session?.role, allowedViews]);

  const renderContent = () => {
    if (activeView === 'Manager') return <ManagerDashboard />;
    if (activeView === 'Chef') return <ChefPortal />;
    return <CookPortal />;
  };

  return (
    <Layout userRole={activeView} userEmail={session?.email} onLogout={onLogout}>
      <div className="px-4 py-4 lg:px-8 lg:py-6">
        {allowedViews.length > 1 ? (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Switch View
            </span>
            {allowedViews.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeView === view
                    ? 'bg-orange-600 border-orange-500 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-orange-500/60'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        ) : null}
        {renderContent()}
      </div>
    </Layout>
  );
}

