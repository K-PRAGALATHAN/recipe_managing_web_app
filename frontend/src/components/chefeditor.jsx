import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Minus, Clock, Users } from 'lucide-react';
import { useRecipe } from './hooks/userecipe';

export default function ChefEditor({ recipeId, onClose, onSave }) {
  const { getRecipe, createRecipe, updateRecipe, loading } = useRecipe();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Draft',
    servings: 1,
    prepTime: 0,
    cookTime: 0,
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [''],
    notes: '',
    version: 1,
  });

  const isEditMode = !!recipeId;

  useEffect(() => {
    if (recipeId) {
      loadRecipe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const loadRecipe = async () => {
    try {
      const recipe = await getRecipe(recipeId);
      if (recipe) {
        setFormData({
          name: recipe.name || '',
          description: recipe.description || '',
          status: recipe.status || 'Draft',
          servings: recipe.servings || 1,
          prepTime: recipe.prep_time || 0,
          cookTime: recipe.cook_time || 0,
          ingredients: recipe.ingredients?.length > 0 
            ? recipe.ingredients 
            : [{ name: '', quantity: '', unit: '' }],
          instructions: recipe.instructions?.length > 0 
            ? recipe.instructions 
            : [''],
          notes: recipe.notes || '',
          version: recipe.version || 1,
        });
      }
    } catch (error) {
      console.error('Error loading recipe:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // For create, use the format expected by createRecipe (camelCase)
      // For update, use the format expected by database (snake_case)
      const recipeData = isEditMode ? {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        servings: formData.servings,
        prep_time: formData.prepTime,
        cook_time: formData.cookTime,
        ingredients: formData.ingredients.filter(ing => ing.name.trim()),
        instructions: formData.instructions.filter(inst => inst.trim()),
        notes: formData.notes,
        version: formData.version,
      } : {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        servings: formData.servings,
        prepTime: formData.prepTime,
        cookTime: formData.cookTime,
        ingredients: formData.ingredients.filter(ing => ing.name.trim()),
        instructions: formData.instructions.filter(inst => inst.trim()),
        notes: formData.notes,
        version: formData.version,
      };

      let savedRecipe;
      if (isEditMode) {
        savedRecipe = await updateRecipe(recipeId, recipeData);
      } else {
        savedRecipe = await createRecipe(recipeData);
      }

      onSave?.(savedRecipe);
      onClose?.();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }],
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ''],
    }));
  };

  const removeInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const updateInstruction = (index, value) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => (i === index ? value : inst)),
    }));
  };

  const inputClass = 'h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500/70 focus:ring-4';
  const textareaClass = 'w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500/70 focus:ring-4 min-h-[80px]';
  const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60';
  const buttonSecondaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-500/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Basic Information</h3>
            
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                Recipe Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                required
                placeholder="e.g., Grilled Salmon"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className={textareaClass}
                placeholder="Brief description of the recipe..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                  <Clock size={14} className="inline mr-1" />
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={formData.prepTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                  className={inputClass}
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                  <Clock size={14} className="inline mr-1" />
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookTime: parseInt(e.target.value) || 0 }))}
                  className={inputClass}
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                  <Users size={14} className="inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  className={inputClass}
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className={inputClass}
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
              </select>
            </div>
          </div>

          {/* Ingredients */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Ingredients</h3>
              <button
                type="button"
                onClick={addIngredient}
                className={buttonSecondaryClass}
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className={`${inputClass} col-span-5`}
                  placeholder="Ingredient name"
                />
                <input
                  type="text"
                  value={ingredient.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  className={`${inputClass} col-span-3`}
                  placeholder="Qty"
                />
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                  className={`${inputClass} col-span-3`}
                  placeholder="Unit (kg, cups, etc.)"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="col-span-1 rounded-xl p-2 text-red-400 hover:bg-red-950/30 transition"
                  disabled={formData.ingredients.length === 1}
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Instructions</h3>
              <button
                type="button"
                onClick={addInstruction}
                className={buttonSecondaryClass}
              >
                <Plus size={16} />
                Add Step
              </button>
            </div>

            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 font-bold text-sm">
                  {index + 1}
                </div>
                <textarea
                  value={instruction}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  className={`${textareaClass} flex-1`}
                  placeholder={`Step ${index + 1}...`}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className="flex-shrink-0 rounded-xl p-2 text-red-400 hover:bg-red-950/30 transition"
                  disabled={formData.instructions.length === 1}
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className={textareaClass}
              placeholder="Additional notes, tips, or variations..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className={buttonSecondaryClass}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className={buttonClass}
            >
              <Save size={16} />
              {loading ? 'Saving...' : isEditMode ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
