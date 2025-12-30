import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChefHat, ClipboardCheck, FilePlus2, Edit2, Trash2 } from 'lucide-react';
import ChefEditor from './chefeditor';
import { useRecipe } from './hooks/userecipe';

export default function ChefPortal() {
  const { recipes, fetchRecipes, deleteRecipe, approveRecipe } = useRecipe();
  const [filter, setFilter] = useState('All');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState(null);

  const filtered = useMemo(() => {
    const recipeList = recipes || [];
    if (filter === 'All') return recipeList;
    return recipeList.filter((recipe) => recipe.status === filter);
  }, [recipes, filter]);

  const handleNewRecipe = () => {
    setEditingRecipeId(null);
    setShowEditor(true);
  };

  const handleEditRecipe = (recipeId) => {
    setEditingRecipeId(recipeId);
    setShowEditor(true);
  };

  const handleSaveRecipe = () => {
    setShowEditor(false);
    setEditingRecipeId(null);
    fetchRecipes();
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipe(recipeId);
      } catch (error) {
        alert('Failed to delete recipe. Please try again.');
      }
    }
  };

  const handleApproveRecipe = async (recipeId) => {
    try {
      await approveRecipe(recipeId);
    } catch (error) {
      alert('Failed to approve recipe. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';
  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
      active
        ? 'bg-emerald-600 border-emerald-500 text-white'
        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-emerald-500/60'
    }`;

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600/15 ring-1 ring-emerald-500/20">
            <ChefHat className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Chef Portal</h1>
            <p className="text-sm text-zinc-400">Create recipes, manage versions, approve releases.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNewRecipe}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <FilePlus2 size={16} />
            New recipe
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total recipes', value: String(recipes?.length || 0), icon: <CheckCircle2 size={18} /> },
          { label: 'Pending approvals', value: String(recipes?.filter(r => r.status === 'Pending').length || 0), icon: <ClipboardCheck size={18} /> },
          { label: 'Active versions', value: String(recipes?.filter(r => r.status === 'Approved').length || 0), icon: <ChefHat size={18} /> },
        ].map((kpi) => (
          <div key={kpi.label} className={card}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{kpi.label}</p>
              <span className="text-zinc-500">{kpi.icon}</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {['All', 'Approved', 'Pending', 'Draft'].map((value) => (
          <button key={value} type="button" className={pill(filter === value)} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-8 text-center">
            <p className="text-zinc-400">No recipes found. Create your first recipe to get started!</p>
          </div>
        ) : (
          filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{recipe.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Updated {formatDate(recipe.updated_at || recipe.updatedAt)}
                  {recipe.description && ` • ${recipe.description.substring(0, 50)}${recipe.description.length > 50 ? '...' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    recipe.status === 'Approved'
                      ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                      : recipe.status === 'Pending'
                        ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                        : 'bg-zinc-500/10 text-zinc-200 ring-1 ring-zinc-500/20'
                  }`}
                >
                  {recipe.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleEditRecipe(recipe.id)}
                  className="rounded-xl p-2 text-emerald-400 hover:bg-emerald-950/30 transition"
                  title="Edit recipe"
                >
                  <Edit2 size={16} />
                </button>
                {recipe.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={() => handleApproveRecipe(recipe.id)}
                    className="rounded-xl p-2 text-emerald-400 hover:bg-emerald-950/30 transition"
                    title="Approve recipe"
                  >
                    <ClipboardCheck size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteRecipe(recipe.id)}
                  className="rounded-xl p-2 text-red-400 hover:bg-red-950/30 transition"
                  title="Delete recipe"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditor && (
        <ChefEditor
          recipeId={editingRecipeId}
          onClose={() => {
            setShowEditor(false);
            setEditingRecipeId(null);
          }}
          onSave={handleSaveRecipe}
        />
      )}
    </div>
  );
}

