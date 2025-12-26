import { createSupabaseClient } from './supabase.js';

const supabase = createSupabaseClient();

function toISODateOnly(date) {
  return typeof date === 'string' ? date : String(date);
}

export async function getMenu() {
  const { data, error } = await supabase.from('menu_items').select('id,name,minutes').order('id');
  if (error) throw error;
  return { items: (data ?? []).map((row) => ({ id: row.id, name: row.name, minutes: row.minutes })) };
}

export async function getCookStateByDate(date) {
  const day = toISODateOnly(date);
  const { data, error } = await supabase
    .from('cook_day_menu')
    .select('menu_id,done')
    .eq('day_date', day);
  if (error) throw error;

  const selectedMenuIds = (data ?? []).map((row) => row.menu_id);
  const doneIds = (data ?? []).filter((row) => row.done).map((row) => row.menu_id);

  return { base: null, day: { selectedMenuIds, doneIds } };
}

export async function setCookStateByDate(date, nextDayState) {
  const day = toISODateOnly(date);

  const { error: deleteError } = await supabase.from('cook_day_menu').delete().eq('day_date', day);
  if (deleteError) throw deleteError;

  const selectedMenuIds = Array.isArray(nextDayState?.selectedMenuIds)
    ? nextDayState.selectedMenuIds.map(String)
    : [];
  const doneSet = new Set(Array.isArray(nextDayState?.doneIds) ? nextDayState.doneIds.map(String) : []);

  if (selectedMenuIds.length > 0) {
    const rows = selectedMenuIds.map((menuId) => ({
      day_date: day,
      menu_id: menuId,
      done: doneSet.has(menuId),
    }));
    const { error: insertError } = await supabase.from('cook_day_menu').insert(rows);
    if (insertError) throw insertError;
  }

  return {
    selectedMenuIds,
    doneIds: selectedMenuIds.filter((menuId) => doneSet.has(menuId)),
  };
}
