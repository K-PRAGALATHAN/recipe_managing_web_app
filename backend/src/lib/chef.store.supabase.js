import { createSupabaseClient } from './supabase.js';

const supabase = createSupabaseClient();

/**
 * Normalizes recipe data from JSON column into clean object
 */
function normalizeRecipeData(data) {
    // Use same normalization logic as before, or trust the JSON
    // For safety, let's keep it minimal or just return the object if we trust backend validation
    return data || { portions: null, yield: null, ingredients: [], steps: [] };
}

export async function listRecipes() {
    const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
      id, name, created_at, created_by, archived,
      recipe_versions (version, status, updated_at)
    `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[supabase:listRecipes] error:', error);
        throw error;
    }

    // Transform to match expected internal format
    return recipes.map(r => {
        // Find latest version/status metadata from subquery
        // Note: Supabase nested select returns an array
        const sortedVersions = r.recipe_versions?.sort((a, b) => b.version - a.version) || [];
        const latest = sortedVersions[0];

        return {
            id: r.id,
            name: r.name,
            createdAt: r.created_at,
            createdBy: r.created_by,
            latestVersion: latest?.version,
            latestStatus: latest?.status,
            latestUpdatedAt: latest?.updated_at || r.created_at // Fallback
        };
    });
}

export async function getRecipeById(id) {
    const { data: recipe, error } = await supabase
        .from('recipes')
        .select(`
      id, name, created_at, created_by, archived,
      recipe_versions (*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('[supabase:getRecipeById] error:', error);
        return null;
    }
    if (!recipe || recipe.archived) return null; // Treat as deleted

    const versions = (recipe.recipe_versions || [])
        .sort((a, b) => b.version - a.version)
        .map(v => ({
            recipeId: v.recipe_id,
            version: v.version,
            status: v.status,
            data: v.data_json,
            createdBy: v.created_by,
            createdAt: v.created_at,
            updatedBy: v.updated_by,
            updatedAt: v.updated_at,
            releasedBy: v.released_by,
            releasedAt: v.released_at
        }));

    return {
        id: recipe.id,
        name: recipe.name,
        createdAt: recipe.created_at,
        createdBy: recipe.created_by,
        versions
    };
}

export async function getRecipeVersion({ recipeId, version }) {
    const { data, error } = await supabase
        .from('recipe_versions')
        .select('*')
        .eq('recipe_id', recipeId)
        .eq('version', version)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('[supabase:getRecipeVersion] error:', error);
        return null;
    }

    return {
        recipeId: data.recipe_id,
        version: data.version,
        status: data.status,
        data: data.data_json,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
        releasedBy: data.released_by,
        releasedAt: data.released_at
    };
}

export async function createRecipe({ name, createdBy, initialData }) {
    console.log('[supabase:createRecipe] inserting recipe:', { name, createdBy });
    // 1. Create Recipe
    const { data: recipe, error: rError } = await supabase
        .from('recipes')
        .insert({
            name,
            created_by: createdBy
        })
        .select()
        .single();

    if (rError) {
        console.error('[supabase:createRecipe] recipe insert failed:', rError);
        throw rError;
    }

    console.log('[supabase:createRecipe] recipe created, inserting version:', recipe.id);

    // 2. Create Initial Draft Version
    const { error: vError } = await supabase
        .from('recipe_versions')
        .insert({
            recipe_id: recipe.id,
            version: 1,
            status: 'draft',
            data_json: initialData,
            created_by: createdBy
        });

    if (vError) {
        console.error('[supabase:createRecipe] version insert failed:', vError);
        // Cleanup if version creation fails (optional but good practice)
        await supabase.from('recipes').delete().eq('id', recipe.id);
        throw vError;
    }

    return { recipe: await getRecipeById(recipe.id) };
}

export async function createRecipeVersion({ recipeId, createdBy, data }) {
    // Get max version
    const { data: maxVer, error: mError } = await supabase
        .from('recipe_versions')
        .select('version')
        .eq('recipe_id', recipeId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

    if (mError && mError.code !== 'PGRST116') throw mError; // PGRST116 is 'not found', meaning 0 versions (shouldn't happen but ok)

    const currentVersion = maxVer?.version || 0;
    const nextVersion = currentVersion + 1;

    const { data: newVer, error } = await supabase
        .from('recipe_versions')
        .insert({
            recipe_id: recipeId,
            version: nextVersion,
            status: 'draft',
            data_json: data,
            created_by: createdBy
        })
        .select()
        .single();

    if (error) throw error;

    return getRecipeVersion({ recipeId, version: nextVersion });
}

export async function updateDraftRecipeVersion({ recipeId, version, updatedBy, data }) {
    // Check if draft
    const existing = await getRecipeVersion({ recipeId, version });
    if (!existing) return null;
    if (existing.status !== 'draft') return 'not_draft';

    const { error } = await supabase
        .from('recipe_versions')
        .update({
            data_json: data,
            updated_by: updatedBy,
            updated_at: new Date().toISOString()
        })
        .eq('recipe_id', recipeId)
        .eq('version', version);

    if (error) throw error;

    return getRecipeVersion({ recipeId, version });
}

export async function releaseRecipeVersion({ recipeId, version, releasedBy }) {
    const existing = await getRecipeVersion({ recipeId, version });
    if (!existing) return null;
    if (existing.status !== 'draft') return 'not_draft';

    const { error } = await supabase
        .from('recipe_versions')
        .update({
            status: 'released',
            released_by: releasedBy,
            released_at: new Date().toISOString()
        })
        .eq('recipe_id', recipeId)
        .eq('version', version);

    if (error) throw error;

    return getRecipeVersion({ recipeId, version });
}

export async function deleteRecipe(id) {
    // Soft delete
    const { error } = await supabase
        .from('recipes')
        .update({ archived: true })
        .eq('id', id);

    if (error) throw error;
    return true;
}
