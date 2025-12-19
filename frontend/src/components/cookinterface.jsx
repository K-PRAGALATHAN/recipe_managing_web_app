// Cook Dashboard
  const CookDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-3 rounded-lg">
                <UtensilsCrossed size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Cook Dashboard</h1>
                <p className="text-gray-600">Welcome back, {currentUser.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Today's Menu</h3>
            <p className="text-4xl font-bold text-orange-600">8</p>
            <p className="text-sm text-gray-500 mt-2">Items to prepare</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Completed</h3>
            <p className="text-4xl font-bold text-green-600">5</p>
            <p className="text-sm text-green-600 mt-2">62% progress</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">In Progress</h3>
            <p className="text-4xl font-bold text-blue-600">3</p>
            <p className="text-sm text-gray-500 mt-2">Currently cooking</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Today's Recipes</h2>
            <div className="space-y-3">
              {[
                { name: 'Grilled Salmon', time: '25 min', status: 'completed' },
                { name: 'Caesar Salad', time: '15 min', status: 'completed' },
                { name: 'Pasta Carbonara', time: '30 min', status: 'in-progress' },
                { name: 'Beef Wellington', time: '45 min', status: 'pending' },
                { name: 'Chocolate Cake', time: '40 min', status: 'pending' }
              ].map((recipe, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div>
                    <div className="font-medium">{recipe.name}</div>
                    <div className="text-sm text-gray-500">{recipe.time}</div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    recipe.status === 'completed' ? 'bg-green-500 text-white' :
                    recipe.status === 'in-progress' ? 'bg-blue-500 text-white' :
                    'bg-orange-500 text-white hover:bg-orange-600'
                  }`}>
                    {recipe.status === 'completed' ? '✓ Done' :
                     recipe.status === 'in-progress' ? '⏱ Cooking' :
                     'Start'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Quick Tips</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm font-medium text-blue-900">🔥 Preheat oven to 180°C for Beef Wellington</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-sm font-medium text-green-900">✓ All ingredients for Pasta Carbonara are ready</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <p className="text-sm font-medium text-yellow-900">⚠️ Low stock: Check cream availability</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-3 text-gray-900">Prep Checklist</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked className="rounded" readOnly />
                  <span className="text-sm line-through">Wash vegetables</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked className="rounded" readOnly />
                  <span className="text-sm line-through">Prepare sauces</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Set up stations</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render appropriate dashboard based on user role
  if (currentUser) {
    switch (currentUser.role) {
      case 'manager':
        return <ManagerDashboard />;
      case 'chef':
        return <ChefDashboard />;
      case 'cook':
        return <CookDashboard />;
      default:
        return null;
    }
  }