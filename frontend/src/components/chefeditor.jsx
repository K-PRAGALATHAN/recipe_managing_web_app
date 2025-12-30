// Chef Dashboard
  const ChefDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-3 rounded-lg">
                <ChefHat size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chef Dashboard</h1>
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
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Total Recipes</h3>
            <p className="text-4xl font-bold text-green-600">47</p>
            <p className="text-sm text-gray-500 mt-2">12 pending approval</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Active Versions</h3>
            <p className="text-4xl font-bold text-blue-600">23</p>
            <p className="text-sm text-gray-500 mt-2">In production</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">This Week</h3>
            <p className="text-4xl font-bold text-purple-600">5</p>
            <p className="text-sm text-gray-500 mt-2">New recipes created</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg">
                ➕ Create New Recipe
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg">
                📝 Edit Existing Recipe
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg">
                🔄 Manage Versions
              </button>
              <button className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg">
                ✅ Approve Recipes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Recipes</h2>
            <div className="space-y-3">
              {[
                { name: 'Grilled Salmon', status: 'Approved' },
                { name: 'Caesar Salad', status: 'Pending' },
                { name: 'Pasta Carbonara', status: 'Approved' },
                { name: 'Beef Wellington', status: 'Draft' }
              ].map((recipe, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{recipe.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    recipe.status === 'Approved' ? 'bg-green-100 text-green-700' :
                    recipe.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {recipe.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );the quijk bers\
  \\