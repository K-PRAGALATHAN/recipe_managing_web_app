import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChefHat, ClipboardCheck, FilePlus2, Pencil, Trash2 } from 'lucide-react';
import AddRecipeModal from './AddRecipeModal.jsx';
import { createChefRecipe, listChefRecipes, getRecipe, updateDraftRecipeVersion, deleteRecipe } from '../utils/chefApi';

const startOfDay = (ts) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const formatUpdatedAt = (ts) => {
  const today = startOfDay(Date.now());
  const thatDay = startOfDay(ts);
  const diffDays = Math.round((today - thatDay) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const uiStatus = (latestStatus) => {
  const s = String(latestStatus ?? '').toLowerCase();
  if (s === 'released') return 'Approved';
  return 'Draft';
};

const toUpdatedAtMs = ({ latestUpdatedAt, createdAt }) => {
  const candidates = [latestUpdatedAt, createdAt].filter(Boolean);
  for (const v of candidates) {
    const ms = Date.parse(String(v));
    if (Number.isFinite(ms)) return ms;
  }
  return Date.now();
};

export default function ChefPortal() {
  const [filter, setFilter] = useState('All');
  const [recipes, setRecipes] = useState(() => []);
  const [showAdd, setShowAdd] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { recipes: rows } = await listChefRecipes();
        if (cancelled) return;
        const normalized = Array.isArray(rows)
          ? rows.map((r) => ({
            id: String(r.id),
            name: String(r.name ?? ''),
            status: uiStatus(r.latestStatus),
            updatedAt: toUpdatedAtMs({ latestUpdatedAt: r.latestUpdatedAt, createdAt: r.createdAt }),
          }))
          : [];
        setRecipes(normalized);
      } catch (err) {
        if (cancelled) return;
        setNotice(`Failed to load recipes: ${err?.message ?? 'unknown_error'}`);
        window.setTimeout(() => setNotice(null), 3500);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return recipes;
    return recipes.filter((recipe) => recipe.status === filter);
  }, [filter, recipes]);

  const kpis = useMemo(() => {
    const total = recipes.length;
    const drafts = recipes.filter((r) => r.status === 'Draft').length;
    const active = recipes.filter((r) => r.status === 'Approved').length;
    return { total, drafts, active };
  }, [recipes]);

  const handleEdit = async (recipeId) => {
    try {
      const { recipe } = await getRecipe(recipeId);
      if (!recipe) throw new Error('Recipe not found');

      // Find the draft version (assuming only one draft exists or we pick the latest)
      // The backend usually creates logic where versions are monotonic.
      // We look for a version with status 'draft'.
      const draft = recipe.versions?.find((v) => String(v.status).toLowerCase() === 'draft');

      if (!draft) {
        setNotice('This recipe has no draft version to edit.');
        window.setTimeout(() => setNotice(null), 3000);
        return;
      }

      setEditingData({
        id: recipe.id,
        version: draft.version,
        name: recipe.name,
        // Spread the draft data (ingredients, steps, etc.) into the form
        ...draft.data,
      });
      setShowAdd(true);
    } catch (err) {
      console.error(err);
      setNotice('Failed to load recipe details.');
      window.setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleDelete = async (recipeId, recipeName) => {
    if (!window.confirm(`Are you sure you want to delete "${recipeName}"? This action cannot be undone.`)) return;
    try {
      await deleteRecipe(recipeId);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setNotice(`Recipe "${recipeName}" deleted.`);
      window.setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error(err);
      setNotice('Failed to delete recipe. Please try again.');
    }
  };

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';
  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active
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
            <h1 className="text-2xl font-extrabold text-white">Recipes</h1>
            <p className="text-sm text-zinc-400">View and manage your recipe collection.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('Draft')}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 hover:border-emerald-500/60"
          >
            <ClipboardCheck size={16} />
            Drafts
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: 'Total recipes', value: String(kpis.total), icon: <CheckCircle2 size={18} /> },
          { label: 'Drafts', value: String(kpis.drafts), icon: <ClipboardCheck size={18} /> },
          { label: 'Active versions', value: String(kpis.active), icon: <ChefHat size={18} /> },
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
        {['All', 'Approved', 'Draft'].map((value) => (
          <button key={value} type="button" className={pill(filter === value)} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.map((recipe) => (
          <div
            key={recipe.id}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{recipe.name}</p>
              <p className="mt-1 text-xs text-zinc-500">Updated {formatUpdatedAt(recipe.updatedAt)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDelete(recipe.id, recipe.name)}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-red-500/60 hover:text-red-400"
                title="Delete recipe"
              >
                <Trash2 size={14} />
              </button>
              {recipe.status === 'Draft' ? (
                <button
                  onClick={() => handleEdit(recipe.id)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:border-emerald-500/60 hover:text-emerald-400"
                  aria-label="Edit recipe"
                >
                  <Pencil size={14} />
                </button>
              ) : null}
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${recipe.status === 'Approved'
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'bg-zinc-500/10 text-zinc-200 ring-1 ring-zinc-500/20'
                  }`}
              >
                {recipe.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AddRecipeModal
        open={showAdd}
        initialData={editingData}
        onClose={() => {
          setShowAdd(false);
          setEditingData(null);
        }}
        onCreate={async (payload) => {
          try {
            if (editingData) {
              // Update mode
              await updateDraftRecipeVersion({
                recipeId: editingData.id,
                version: editingData.version,
                payload
              });
              setNotice(`Recipe “${payload.name}” updated.`);
              // Optimistic update
              setRecipes(prev => prev.map(r => r.id === editingData.id ? { ...r, name: payload.name, updatedAt: Date.now() } : r));
            } else {
              // Create mode
              const { recipe } = await createChefRecipe({
                name: payload.name,
                description: payload.description,
                category: payload.category,
                imageUrl: payload.imageUrl,
                prepMinutes: payload.prepMinutes,
                cookMinutes: payload.cookMinutes,
                servings: payload.servings,
                tags: payload.tags,
                ingredients: payload.ingredients,
                steps: payload.steps,
              });

              const latest = Array.isArray(recipe?.versions) ? recipe.versions[0] : null;

              setRecipes((prev) => [
                {
                  id: String(recipe.id),
                  name: String(recipe.name ?? payload.name),
                  status: uiStatus(latest?.status),
                  updatedAt: toUpdatedAtMs({
                    latestUpdatedAt: latest?.updatedAt ?? latest?.createdAt,
                    createdAt: recipe.createdAt,
                  }),
                },
                ...prev,
              ]);
              setFilter('All');
              setNotice(`Recipe “${payload.name}” created.`);
            }
          } catch (err) {
            console.error('[ChefPortal:onCreate] error:', err);
            setNotice(`Failed to ${editingData ? 'update' : 'create'} recipe: ${err?.message ?? 'unknown_error'}`);
          } finally {
            window.setTimeout(() => setNotice(null), 3500);
          }
        }}
      />
    </div>
  );
}
