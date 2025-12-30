import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';

/**
 * Custom hook for recipe management operations
 * Provides CRUD operations for recipes with Supabase integration
 */
export function useRecipe() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all recipes
  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRecipes(data || []);
      return data || [];
    } catch (err) {
      setError(err.message);
      console.error('Error fetching recipes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new recipe
  const createRecipe = async (recipeData) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newRecipe = {
        name: recipeData.name,
        description: recipeData.description || '',
        status: recipeData.status || 'Draft',
        servings: recipeData.servings || 1,
        prep_time: recipeData.prepTime || 0,
        cook_time: recipeData.cookTime || 0,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        notes: recipeData.notes || '',
        version: recipeData.version || 1,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('recipes')
        .insert([newRecipe])
        .select()
        .single();

      if (insertError) throw insertError;
      
      setRecipes(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error creating recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing recipe
  const updateRecipe = async (recipeId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateError } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setRecipes(prev => prev.map(r => r.id === recipeId ? data : r));
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error updating recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a recipe
  const deleteRecipe = async (recipeId) => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (deleteError) throw deleteError;
      
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error deleting recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve a recipe (change status to Approved)
  const approveRecipe = async (recipeId) => {
    return updateRecipe(recipeId, { status: 'Approved' });
  };

  // Get a single recipe by ID
  const getRecipe = async (recipeId) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching recipe:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    approveRecipe,
    getRecipe,
  };
}

export default useRecipe;

