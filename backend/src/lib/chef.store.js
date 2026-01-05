import * as supabaseStore from './chef.store.supabase.js';

export async function listRecipes() {
  return supabaseStore.listRecipes();
}

export async function getRecipeById(id) {
  return supabaseStore.getRecipeById(id);
}

export async function getRecipeVersion(args) {
  return supabaseStore.getRecipeVersion(args);
}

export async function createRecipe(args) {
  return supabaseStore.createRecipe(args);
}

export async function createRecipeVersion(args) {
  return supabaseStore.createRecipeVersion(args);
}

export async function updateDraftRecipeVersion(args) {
  return supabaseStore.updateDraftRecipeVersion(args);
}

export async function releaseRecipeVersion(args) {
  return supabaseStore.releaseRecipeVersion(args);
}

export async function deleteRecipe(id) {
  return supabaseStore.deleteRecipe(id);
}

