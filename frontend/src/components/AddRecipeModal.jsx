import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

const STATUSES = ['Draft', 'Pending', 'Approved'];

const createEmptyForm = () => ({
  name: '',
  description: '',
  category: '',
  imageUrl: '',
  prepMinutes: '',
  cookMinutes: '',
  servings: '',
  status: 'Draft',
  ingredients: [''],
  steps: [''],
  tagsCsv: '',
});

const normalizeLines = (lines) => lines.map((line) => line.trim()).filter(Boolean);

export default function AddRecipeModal({ open, onClose, onCreate, initialData }) {
  const [form, setForm] = useState(createEmptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setForm({
        ...createEmptyForm(),
        ...initialData,
        ingredients: Array.isArray(initialData.ingredients)
          ? initialData.ingredients.map(i => typeof i === 'object' ? i.name : i)
          : [''],
        tagsCsv: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
      });
    } else {
      setForm(createEmptyForm());
    }

    setErrors({});
    setSubmitting(false);
    queueMicrotask(() => firstInputRef.current?.focus?.());
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const cleanedIngredients = useMemo(() => normalizeLines(form.ingredients), [form.ingredients]);
  const cleanedSteps = useMemo(() => normalizeLines(form.steps), [form.steps]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setListItem = (key, index, value) => {
    setForm((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  };

  const addListItem = (key) => setForm((prev) => ({ ...prev, [key]: [...prev[key], ''] }));

  const removeListItem = (key, index) => {
    setForm((prev) => {
      const next = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: next.length ? next : [''] };
    });
  };

  const isValidNumberField = (value) => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return true;
    const num = Number(trimmed);
    return Number.isFinite(num) && num >= 0;
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Recipe name is required.';
    if (!cleanedIngredients.length) nextErrors.ingredients = 'Add at least one ingredient.';
    if (!cleanedSteps.length) nextErrors.steps = 'Add at least one step.';
    if (form.imageUrl && !/^https?:\/\//i.test(form.imageUrl.trim())) nextErrors.imageUrl = 'Enter a valid http(s) URL.';
    if (!isValidNumberField(form.prepMinutes)) nextErrors.prepMinutes = 'Enter a valid non-negative number.';
    if (!isValidNumberField(form.cookMinutes)) nextErrors.cookMinutes = 'Enter a valid non-negative number.';
    if (!isValidNumberField(form.servings)) nextErrors.servings = 'Enter a valid non-negative number.';
    return nextErrors;
  };

  const toNumberOrNull = (value) => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const tags = form.tagsCsv
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await onCreate?.({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        prepMinutes: toNumberOrNull(form.prepMinutes),
        cookMinutes: toNumberOrNull(form.cookMinutes),
        servings: toNumberOrNull(form.servings),
        status: STATUSES.includes(form.status) ? form.status : 'Draft',
        ingredients: cleanedIngredients,
        steps: cleanedSteps,
        tags,
      });
      setForm(createEmptyForm());
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const label = 'block text-xs font-semibold uppercase tracking-widest text-zinc-500';
  const input =
    'mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70"
        onClick={() => onClose?.()}
      />

      <div className="relative mx-auto mt-10 w-[min(720px,calc(100%-2rem))] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Chef Portal</p>
            <h2 className="mt-1 text-lg font-extrabold text-white">{initialData ? 'Edit recipe' : 'Create new recipe'}</h2>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-emerald-500/60"
            onClick={() => onClose?.()}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="max-h-[calc(100vh-8rem)] overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={label} htmlFor="recipe-name">
                Recipe name <span className="text-rose-400">*</span>
              </label>
              <input
                id="recipe-name"
                ref={firstInputRef}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={input}
                placeholder="e.g., Grilled Salmon"
              />
              {errors.name ? <p className="mt-2 text-xs font-medium text-rose-300">{errors.name}</p> : null}
            </div>

            <div>
              <label className={label} htmlFor="recipe-status">
                Status
              </label>
              <select
                id="recipe-status"
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className={input}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={label} htmlFor="recipe-category">
                Category
              </label>
              <input
                id="recipe-category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className={input}
                placeholder="e.g., Seafood"
              />
            </div>

            <div className="md:col-span-2">
              <label className={label} htmlFor="recipe-description">
                Description
              </label>
              <textarea
                id="recipe-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={`${input} min-h-24`}
                placeholder="Short summary for the menu..."
              />
            </div>

            <div>
              <label className={label} htmlFor="recipe-prep">
                Prep minutes
              </label>
              <input
                id="recipe-prep"
                inputMode="numeric"
                value={form.prepMinutes}
                onChange={(e) => setField('prepMinutes', e.target.value)}
                className={input}
                placeholder="e.g., 10"
              />
              {errors.prepMinutes ? (
                <p className="mt-2 text-xs font-medium text-rose-300">{errors.prepMinutes}</p>
              ) : null}
            </div>

            <div>
              <label className={label} htmlFor="recipe-cook">
                Cook minutes
              </label>
              <input
                id="recipe-cook"
                inputMode="numeric"
                value={form.cookMinutes}
                onChange={(e) => setField('cookMinutes', e.target.value)}
                className={input}
                placeholder="e.g., 15"
              />
              {errors.cookMinutes ? (
                <p className="mt-2 text-xs font-medium text-rose-300">{errors.cookMinutes}</p>
              ) : null}
            </div>

            <div>
              <label className={label} htmlFor="recipe-servings">
                Servings
              </label>
              <input
                id="recipe-servings"
                inputMode="numeric"
                value={form.servings}
                onChange={(e) => setField('servings', e.target.value)}
                className={input}
                placeholder="e.g., 2"
              />
              {errors.servings ? <p className="mt-2 text-xs font-medium text-rose-300">{errors.servings}</p> : null}
            </div>

            <div>
              <label className={label} htmlFor="recipe-tags">
                Tags
              </label>
              <input
                id="recipe-tags"
                value={form.tagsCsv}
                onChange={(e) => setField('tagsCsv', e.target.value)}
                className={input}
                placeholder="e.g., gluten-free, spicy"
              />
            </div>

            <div className="md:col-span-2">
              <label className={label} htmlFor="recipe-image-url">
                Image URL
              </label>
              <input
                id="recipe-image-url"
                value={form.imageUrl}
                onChange={(e) => setField('imageUrl', e.target.value)}
                className={input}
                placeholder="https://..."
              />
              {errors.imageUrl ? <p className="mt-2 text-xs font-medium text-rose-300">{errors.imageUrl}</p> : null}
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className={label}>
                  Ingredients <span className="text-rose-400">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => addListItem('ingredients')}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-emerald-500/60"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {form.ingredients.map((value, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={value}
                      onChange={(e) => setListItem('ingredients', idx, e.target.value)}
                      className={input}
                      placeholder={idx === 0 ? 'e.g., 200g salmon' : 'Ingredient'}
                    />
                    <button
                      type="button"
                      aria-label="Remove ingredient"
                      onClick={() => removeListItem('ingredients', idx)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-rose-500/60"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              {errors.ingredients ? (
                <p className="mt-2 text-xs font-medium text-rose-300">{errors.ingredients}</p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className={label}>
                  Steps <span className="text-rose-400">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => addListItem('steps')}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-100 hover:border-emerald-500/60"
                >
                  Add
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {form.steps.map((value, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={value}
                      onChange={(e) => setListItem('steps', idx, e.target.value)}
                      className={input}
                      placeholder={idx === 0 ? 'e.g., Preheat oven to 180°C' : 'Step'}
                    />
                    <button
                      type="button"
                      aria-label="Remove step"
                      onClick={() => removeListItem('steps', idx)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-rose-500/60"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
              {errors.steps ? <p className="mt-2 text-xs font-medium text-rose-300">{errors.steps}</p> : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => onClose?.()}
              className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-emerald-500/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white ${submitting ? 'bg-emerald-700/60' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
              {submitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save changes' : 'Create recipe')}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}
