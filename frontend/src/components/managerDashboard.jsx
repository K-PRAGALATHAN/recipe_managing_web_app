import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, BarChart3, Building2, Calculator, CheckCircle2, Download, Package, Plus, Settings, Trash2, XCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const formatCurrency = (value) => {
  const num = Number(value);
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number.isFinite(num) ? num : 0
  );
};

const toCsv = (rows) => {
  const escapeCell = (cell) => {
    const text = cell == null ? '' : String(cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return rows.map((row) => row.map(escapeCell).join(',')).join('\n') + '\n';
};

const downloadCsv = (filename, rows) => {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function ManagerDashboard() {
  const [tab, setTab] = useState('overview');
  const [vendors, setVendors] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', leadTimeDays: 2 });
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: 'kg',
    unitCost: '',  // Empty string for controlled input (allows user to clear/type freely)
    onHand: '',    // Empty string for controlled input (allows user to clear/type freely)
    parLevel: '',  // Empty string for controlled input (allows user to clear/type freely)
    vendorId: '',
  });
  const [marginInput, setMarginInput] = useState({ cost: 12.5, price: 24 });
  const [wasteLog, setWasteLog] = useState([]);
  const [wasteDraft, setWasteDraft] = useState({ ingredientId: '', qty: 0.5, reason: 'Prep waste' });
  const [newAccount, setNewAccount] = useState({ email: '', role: 'chef', cuisine: '' });

  const fetchIngredients = async () => {
    try {
      // Select all columns - database uses snake_case
      const { data, error } = await supabase.from('ingredients').select('*');
      if (error) {
        console.error('❌ Failed to load ingredients from Supabase', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return [];
      }

      // Normalize: Convert snake_case from database (on_hand, par_level, unit_cost, vendor_id) to camelCase for UI
      const normalizedData = (data ?? []).map(item => ({
        ...item,
        onHand: Number(item.on_hand ?? 0),
        parLevel: Number(item.par_level ?? 0),
        unitCost: Number(item.unit_cost ?? 0),
        vendorId: item.vendor_id ?? null,
      }));
      setIngredients(normalizedData);
      return normalizedData;
    } catch (err) {
      console.error('❌ Error fetching ingredients - Exception:', err);
      return [];
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.from('vendors').select('*');
      if (error) {
        console.error('Failed to load vendors from Supabase', error);
        return [];
      }
      // Normalize snake_case to camelCase
      const normalized = (data ?? []).map(v => ({
        ...v,
        leadTimeDays: v.lead_time_days
      }));
      setVendors(normalized);
      return normalized;
    } catch (err) {
      console.error('Error fetching vendors', err);
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchVendors();
      await fetchIngredients();
      await fetchWasteLogs();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const vendorsById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])), [vendors]);
  const ingredientsById = useMemo(() => Object.fromEntries(ingredients.map((i) => [i.id, i])), [ingredients]);

  const lowStock = useMemo(
    () => ingredients.filter((i) => Number(i.onHand) < Number(i.parLevel)),
    [ingredients]
  );

  const inventoryValue = useMemo(
    () => ingredients.reduce((sum, i) => sum + Number(i.onHand) * Number(i.unitCost), 0),
    [ingredients]
  );

  const margin = useMemo(() => {
    const cost = Number(marginInput.cost);
    const price = Number(marginInput.price);
    if (!Number.isFinite(cost) || !Number.isFinite(price) || price <= 0) return null;
    const gross = price - cost;
    return { gross, pct: (gross / price) * 100 };
  }, [marginInput]);

  const wasteTotal = useMemo(() => {
    return wasteLog.reduce((sum, entry) => {
      // If we joined data, unitCost might be in entry.ingredients (if using select param)
      // modifying to use the joined data directly or fallback
      const cost = entry.ingredients?.unit_cost || ingredientsById[entry.ingredientId]?.unitCost || 0;
      return sum + Number(entry.qty) * Number(cost);
    }, 0);
  }, [wasteLog, ingredientsById]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'vendors', label: 'Vendors', icon: <Building2 size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
    { id: 'costing', label: 'Costing', icon: <Calculator size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'reports', label: 'Reports', icon: <Download size={18} /> },
  ];

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';
  const input =
    'h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500/70 focus:ring-4';
  const button =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60';
  const buttonSecondary =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:border-orange-500/60';

  const addVendor = async () => {
    const name = newVendor.name.trim();
    if (!name) return;

    const payload = {
      name,
      contact: newVendor.contact.trim() || '—',
      lead_time_days: Math.max(0, Number(newVendor.leadTimeDays) || 0),
      active: true,
    };

    try {
      const { data, error } = await supabase.from('vendors').insert([payload]).select();
      if (error) {
        console.error('Failed to insert vendor', error);
        console.error('Vendor payload:', payload);
        return;
      }
      await fetchVendors();
      setNewVendor({ name: '', contact: '', leadTimeDays: 2 });
    } catch (err) {
      console.error('Error adding vendor', err);
    }
  };

  const removeVendor = async (vendorId) => {
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
      if (error) {
        console.error('Failed to delete vendor', error);
        return;
      }
      // clear vendor_id from any ingredients that referenced this vendor (use snake_case)
      const { error: ingErr } = await supabase.from('ingredients').update({ vendor_id: null }).eq('vendor_id', vendorId);
      if (ingErr) console.error('Failed to clear vendor_id on ingredients', ingErr);
      await fetchVendors();
      await fetchIngredients();
    } catch (err) {
      console.error('Error removing vendor', err);
    }
  };

  const addIngredient = async () => {
    const name = newIngredient.name.trim();
    if (!name) return;

    // Explicitly map camelCase UI state to snake_case database columns
    // Use Number() for type safety on all numeric fields
    // DO NOT include 'id' - let Supabase generate the UUID
    const payload = {
      name: newIngredient.name.trim(),
      unit: newIngredient.unit.trim() || 'unit',
      on_hand: Number(newIngredient.onHand) || 0,
      unit_cost: Number(newIngredient.unitCost) || 0,
      par_level: Number(newIngredient.parLevel) || 0,
      vendor_id: newIngredient.vendorId || null,
    };

    console.log('Adding ingredient - UI state (camelCase):', newIngredient);
    console.log('Adding ingredient - DB payload (snake_case):', payload);
    console.log('Type checks:', {
      'on_hand': typeof payload.on_hand,
      'unit_cost': typeof payload.unit_cost,
      'par_level': typeof payload.par_level,
    });
    console.log('Payload keys (should NOT include id):', Object.keys(payload));

    try {
      const { data, error } = await supabase.from('ingredients').insert([payload]).select();
      if (error) {
        console.error('❌ Failed to insert ingredient - Supabase Error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Payload that failed:', JSON.stringify(payload, null, 2));
        alert(`Failed to add ingredient: ${error.message}\n\nIf you see a "schema cache" error, please:\n1. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)\n2. Clear browser cache\n3. Check console for details`);
        return;
      }
      console.log('✅ Ingredient added successfully:', data);
      // Refresh list from DB to ensure UI sync
      await fetchIngredients();
      // Reset form while preserving defaults
      setNewIngredient({
        name: '',
        unit: 'kg',
        unitCost: '',
        onHand: '',
        parLevel: '',
        vendorId: '',
      });
    } catch (err) {
      console.error('❌ Error adding ingredient - Exception:', err);
      console.error('Exception stack:', err.stack);
      alert(`Error adding ingredient: ${err.message}. Check console for details.`);
    }
  };

  const updateIngredient = async (ingredientId, patch) => {
    // Convert camelCase (UI) to snake_case (database schema)
    const dbPatch = {};
    if ('onHand' in patch) dbPatch.on_hand = Number(patch.onHand) || 0;
    if ('parLevel' in patch) dbPatch.par_level = Number(patch.parLevel) || 0;
    if ('unitCost' in patch) dbPatch.unit_cost = Number(patch.unitCost) || 0;
    if ('vendorId' in patch) dbPatch.vendor_id = patch.vendorId || null;
    if ('unit' in patch) dbPatch.unit = patch.unit;
    if ('name' in patch) dbPatch.name = patch.name;

    // Update local state immediately for responsive UI
    setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i)));

    // Persist to database using snake_case
    try {
      const { error } = await supabase
        .from('ingredients')
        .update(dbPatch)
        .eq('id', ingredientId);

      if (error) {
        console.error('❌ Failed to update ingredient - Supabase Error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('Update payload that failed:', JSON.stringify(dbPatch, null, 2));
        // Revert local state on error
        await fetchIngredients();
      } else {
        console.log('✅ Ingredient updated successfully');
      }
    } catch (err) {
      console.error('❌ Error updating ingredient - Exception:', err);
      // Revert local state on error
      await fetchIngredients();
    }
  };

  const fetchWasteLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('waste_logs')
        .select(`
          id,
          qty,
          reason,
          created_at,
          ingredient_id,
          ingredients (
            name,
            unit,
            unit_cost
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch waste logs', error);
        return;
      }

      // Transform for UI
      const formatted = data.map(d => ({
        id: d.id,
        at: d.created_at,
        ingredientId: d.ingredient_id,
        qty: d.qty,
        reason: d.reason,
        ingredients: d.ingredients // Keep joined data
      }));

      setWasteLog(formatted);
    } catch (err) {
      console.error('Error fetching waste logs', err);
    }
  };

  const logWaste = async () => {
    const qty = Number(wasteDraft.qty);
    if (!wasteDraft.ingredientId || !Number.isFinite(qty) || qty <= 0) return;

    try {
      const { error } = await supabase.from('waste_logs').insert([{
        ingredient_id: parseInt(wasteDraft.ingredientId),
        qty,
        reason: wasteDraft.reason.trim() || 'Prep waste'
      }]);

      if (error) {
        console.error('Failed to log waste', error);
        alert(`Failed to saving waste log: ${error.message}`);
        return;
      }

      await fetchWasteLogs();
      setWasteDraft((prev) => ({ ...prev, qty: 0.5 }));
    } catch (err) {
      console.error('Error logging waste', err);
    }
  };

  const addAccount = async () => {
    const email = newAccount.email.trim();
    if (!email) return;

    try {
      const response = await fetch('http://localhost:3001/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: newAccount.role,
          cuisine: newAccount.cuisine.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created successfully!');
        setNewAccount({ email: '', role: 'chef', cuisine: '' });
      } else {
        alert(`Error creating account: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating account (Network/Exception):', error);
      alert(`Error creating account (Network Error): ${error.message}. Is the backend running on port 3001?`);
    }
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Manager</h1>
          <p className="text-zinc-400">Vendor & ingredient management, costing/margins, inventory & reports.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${tab === t.id
                ? 'border-orange-500/70 bg-orange-600 text-white'
                : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-orange-500/60'
                }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Active Vendors</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{vendors.filter((v) => v.active).length}</p>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ingredients</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{ingredients.length}</p>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Low Stock</p>
            <p className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-white">
              {lowStock.length}
              {lowStock.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-400">
                  <AlertTriangle size={14} />
                  Attention
                </span>
              ) : null}
            </p>
          </div>
          <div className={card}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Inventory Value</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{formatCurrency(inventoryValue)}</p>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <p className="text-sm font-bold text-white">Low Stock Queue</p>
            <div className="mt-4 space-y-2">
              {(lowStock.length ? lowStock : ingredients).slice(0, 4).map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{i.name}</p>
                    <p className="text-xs text-zinc-500">On hand: {i.onHand} {i.unit} • Par: {i.parLevel} {i.unit}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${Number(i.onHand) < Number(i.parLevel)
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                  >
                    {Number(i.onHand) < Number(i.parLevel) ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                    {Number(i.onHand) < Number(i.parLevel) ? 'Low' : 'OK'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <p className="text-sm font-bold text-white">Costing Snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cost</label>
                <input className={input} type="number" min="0" step="0.01" value={marginInput.cost} onChange={(e) => setMarginInput((p) => ({ ...p, cost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Selling Price</label>
                <input className={input} type="number" min="0" step="0.01" value={marginInput.price} onChange={(e) => setMarginInput((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="text-zinc-300">
                {margin ? (
                  <>Gross margin: <span className="font-bold text-white">{formatCurrency(margin.gross)}</span> ({margin.pct.toFixed(1)}%)</>
                ) : (
                  <>Enter cost + price to calculate margin.</>
                )}
              </div>
              <div className="font-semibold text-orange-400">Wastage logged: {formatCurrency(wasteTotal)}</div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'vendors' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className={card}>
            <p className="text-sm font-bold text-white">Add Vendor</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Name</label>
                <input className={input} value={newVendor.name} onChange={(e) => setNewVendor((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Contact</label>
                <input className={input} value={newVendor.contact} onChange={(e) => setNewVendor((p) => ({ ...p, contact: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Lead Time (days)</label>
                <input className={input} type="number" min="0" step="1" value={newVendor.leadTimeDays} onChange={(e) => setNewVendor((p) => ({ ...p, leadTimeDays: e.target.value }))} />
              </div>
              <button type="button" className={button} onClick={addVendor} disabled={!newVendor.name.trim()}>
                <Plus size={16} />
                Add vendor
              </button>
            </div>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <p className="text-sm font-bold text-white">Vendors</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="py-2 pr-4">Vendor</th>
                    <th className="py-2 pr-4">Lead</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {vendors.map((v) => (
                    <tr key={v.id} className="text-zinc-200">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-white">{v.name}</p>
                        <p className="text-xs text-zinc-500">{v.contact}</p>
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">{v.leadTimeDays} day(s)</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${v.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700/30 text-zinc-400'}`}>
                          {v.active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {v.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={buttonSecondary} onClick={() => setVendors((prev) => prev.map((x) => (x.id === v.id ? { ...x, active: !x.active } : x)))}>
                            {v.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button type="button" className={buttonSecondary} onClick={() => removeVendor(v.id)}>
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'inventory' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className={card}>
            <p className="text-sm font-bold text-white">Add Ingredient</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Name</label>
                <input
                  className={input}
                  type="text"
                  value={newIngredient.name ?? ''}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit</label>
                  <input
                    className={input}
                    type="text"
                    value={newIngredient.unit ?? 'kg'}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, unit: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit Cost</label>
                  <input
                    className={input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={newIngredient.unitCost ?? ''}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, unitCost: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">On Hand</label>
                  <input
                    className={input}
                    type="number"
                    min="0"
                    step="0.1"
                    value={newIngredient.onHand ?? ''}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, onHand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Par Level</label>
                  <input
                    className={input}
                    type="number"
                    min="0"
                    step="0.1"
                    value={newIngredient.parLevel ?? ''}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, parLevel: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vendor</label>
                <select
                  className={input}
                  value={newIngredient.vendorId ?? ''}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, vendorId: e.target.value }))}
                >
                  <option value="">—</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <button type="button" className={button} onClick={addIngredient} disabled={!newIngredient.name.trim()}>
                <Plus size={16} />
                Add ingredient
              </button>
            </div>
          </div>

          <div className={`${card} lg:col-span-2`}>
            <p className="text-sm font-bold text-white">Inventory</p>
            <div className="mt-4 space-y-2">
              {ingredients.map((i) => {
                const isLow = Number(i.onHand) < Number(i.parLevel);
                const vendor = vendorsById[i.vendorId];
                return (
                  <div key={i.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{i.name}</p>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${isLow ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {isLow ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                            {isLow ? 'Low' : 'OK'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">Vendor: {vendor?.name || '—'} • {formatCurrency(i.unitCost)} / {i.unit}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={buttonSecondary} onClick={() => updateIngredient(i.id, { onHand: Math.max(0, Number(i.onHand) - 1) })}>−1</button>
                        <button type="button" className={buttonSecondary} onClick={() => updateIngredient(i.id, { onHand: Number(i.onHand) + 1 })}>+1</button>
                        <button
                          type="button"
                          className={buttonSecondary}
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete ${i.name}?`)) {
                              try {
                                const { error } = await supabase
                                  .from('ingredients')
                                  .delete()
                                  .eq('id', i.id);
                                if (error) {
                                  console.error('❌ Failed to delete ingredient:', error);
                                  alert(`Failed to delete ingredient: ${error.message}`);
                                } else {
                                  setIngredients((prev) => prev.filter((x) => x.id !== i.id));
                                  console.log('✅ Ingredient deleted successfully');
                                }
                              } catch (err) {
                                console.error('❌ Error deleting ingredient:', err);
                                alert(`Error deleting ingredient: ${err.message}`);
                              }
                            }
                          }}
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">On Hand</label>
                        <input className={input} type="number" min="0" step="0.1" value={i.onHand} onChange={(e) => updateIngredient(i.id, { onHand: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Par</label>
                        <input className={input} type="number" min="0" step="0.1" value={i.parLevel} onChange={(e) => updateIngredient(i.id, { parLevel: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit Cost</label>
                        <input className={input} type="number" min="0" step="0.01" value={i.unitCost} onChange={(e) => updateIngredient(i.id, { unitCost: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vendor</label>
                        <select className={input} value={i.vendorId || ''} onChange={(e) => updateIngredient(i.id, { vendorId: e.target.value })}>
                          <option value="">—</option>
                          {vendors.map((v) => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'costing' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <p className="text-sm font-bold text-white">Margin Calculator</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Food Cost</label>
                <input className={input} type="number" min="0" step="0.01" value={marginInput.cost} onChange={(e) => setMarginInput((p) => ({ ...p, cost: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Menu Price</label>
                <input className={input} type="number" min="0" step="0.01" value={marginInput.price} onChange={(e) => setMarginInput((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm">
              {margin ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Gross margin</span>
                    <span className="font-bold text-white">{formatCurrency(margin.gross)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-zinc-400">Margin %</span>
                    <span className="font-bold text-orange-400">{margin.pct.toFixed(1)}%</span>
                  </div>
                </>
              ) : (
                <p className="text-zinc-400">Enter a positive menu price.</p>
              )}
            </div>
          </div>

          <div className={card}>
            <p className="text-sm font-bold text-white">Wastage Log</p>
            <p className="mt-1 text-xs text-zinc-500">Track wastage analysis by ingredient cost.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Ingredient</label>
                <select className={input} value={wasteDraft.ingredientId} onChange={(e) => setWasteDraft((p) => ({ ...p, ingredientId: e.target.value }))}>
                  {ingredients.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Quantity</label>
                <input className={input} type="number" min="0" step="0.1" value={wasteDraft.qty} onChange={(e) => setWasteDraft((p) => ({ ...p, qty: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Reason</label>
                <input className={input} value={wasteDraft.reason} onChange={(e) => setWasteDraft((p) => ({ ...p, reason: e.target.value }))} />
              </div>

              <button type="button" className={button} onClick={logWaste}>
                <Plus size={16} />
                Log waste
              </button>
              <div className="flex items-center justify-end text-sm font-semibold text-orange-400">Total: {formatCurrency(wasteTotal)}</div>
            </div>

            <div className="mt-4 space-y-2">
              {wasteLog.length ? (
                wasteLog.slice(0, 6).map((entry) => {
                  const ingredient = ingredientsById[entry.ingredientId];
                  const unit = ingredient?.unit || '';
                  const lineCost = ingredient ? Number(entry.qty) * Number(ingredient.unitCost) : 0;
                  return (
                    <div key={entry.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{ingredient?.name || 'Unknown ingredient'}</p>
                        <p className="text-xs text-zinc-500">{entry.qty} {unit} • {entry.reason}</p>
                      </div>
                      <p className="text-sm font-bold text-white">{formatCurrency(lineCost)}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-400">No waste entries yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'reports' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <p className="text-sm font-bold text-white">Exports</p>
            <p className="mt-1 text-xs text-zinc-500">Download CSVs for daily/weekly/monthly reporting.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={button}
                onClick={() =>
                  downloadCsv('vendors.csv', [
                    ['Name', 'Contact', 'LeadTimeDays', 'Active'],
                    ...vendors.map((v) => [v.name, v.contact, v.leadTimeDays, v.active ? 'Yes' : 'No']),
                  ])
                }
              >
                <Download size={16} />
                Vendors CSV
              </button>

              <button
                type="button"
                className={button}
                onClick={() =>
                  downloadCsv('inventory.csv', [
                    ['Ingredient', 'OnHand', 'Unit', 'Par', 'UnitCost', 'Vendor'],
                    ...ingredients.map((i) => [i.name, i.onHand, i.unit, i.parLevel, i.unitCost, vendorsById[i.vendorId]?.name || '']),
                  ])
                }
              >
                <Download size={16} />
                Inventory CSV
              </button>

              <button
                type="button"
                className={button}
                onClick={() =>
                  downloadCsv('low-stock.csv', [
                    ['Ingredient', 'OnHand', 'Par', 'Unit', 'Vendor'],
                    ...lowStock.map((i) => [i.name, i.onHand, i.parLevel, i.unit, vendorsById[i.vendorId]?.name || '']),
                  ])
                }
              >
                <Download size={16} />
                Low Stock CSV
              </button>

              <button
                type="button"
                className={button}
                onClick={() =>
                  downloadCsv('wastage.csv', [
                    ['At', 'Ingredient', 'Qty', 'Unit', 'UnitCost', 'LineCost', 'Reason'],
                    ...wasteLog.map((entry) => {
                      const ingredient = ingredientsById[entry.ingredientId];
                      const unitCost = Number(ingredient?.unitCost || 0);
                      const lineCost = Number(entry.qty) * unitCost;
                      return [entry.at, ingredient?.name || '', entry.qty, ingredient?.unit || '', unitCost, lineCost, entry.reason];
                    }),
                  ])
                }
              >
                <Download size={16} />
                Wastage CSV
              </button>
            </div>
          </div>

          <div className={card}>
            <p className="text-sm font-bold text-white">Report Summary</p>
            <div className="mt-4 space-y-2">
              {[
                ['Inventory value', formatCurrency(inventoryValue)],
                ['Low stock items', String(lowStock.length)],
                ['Active vendors', String(vendors.filter((v) => v.active).length)],
                ['Logged wastage', formatCurrency(wasteTotal)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <span className="text-sm font-bold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <p className="text-sm font-bold text-white">Add Account</p>
            <p className="mt-1 text-xs text-zinc-500">Create new user accounts for staff or chefs.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email</label>
                <input className={input} type="email" value={newAccount.email} onChange={(e) => setNewAccount((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Role</label>
                <select className={input} value={newAccount.role} onChange={(e) => setNewAccount((p) => ({ ...p, role: e.target.value }))}>
                  <option value="chef">Chef</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cuisine (optional)</label>
                <input className={input} value={newAccount.cuisine} onChange={(e) => setNewAccount((p) => ({ ...p, cuisine: e.target.value }))} />
              </div>
              <button type="button" className={button} onClick={addAccount} disabled={!newAccount.email.trim()}>
                <Plus size={16} />
                Add account
              </button>
            </div>
          </div>

          <div className={card}>
            <p className="text-sm font-bold text-white">Account Management</p>
            <p className="mt-1 text-xs text-zinc-500">Manage user roles and permissions.</p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-zinc-400">Account list and management features coming soon.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
