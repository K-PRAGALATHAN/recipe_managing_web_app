import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Building2, Calculator, CheckCircle2, Download, Package, Plus, Trash2, XCircle } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    Number.isFinite(value) ? value : 0
  );

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

const INITIAL_VENDORS = [
  { id: 'v1', name: 'Fresh Farm Produce', contact: 'freshfarm@example.com', leadTimeDays: 2, active: true },
  { id: 'v2', name: 'Ocean Seafood Co', contact: 'oceanseafood@example.com', leadTimeDays: 1, active: true },
  { id: 'v3', name: 'Metro Meats', contact: 'metromeats@example.com', leadTimeDays: 3, active: true },
];

const INITIAL_INGREDIENTS = [
  { id: 'i1', name: 'Chicken Breast', unit: 'kg', unitCost: 7.5, onHand: 6, parLevel: 10, vendorId: 'v3' },
  { id: 'i2', name: 'Salmon Fillet', unit: 'kg', unitCost: 18.9, onHand: 2, parLevel: 4, vendorId: 'v2' },
  { id: 'i3', name: 'Roma Tomatoes', unit: 'kg', unitCost: 2.2, onHand: 12, parLevel: 8, vendorId: 'v1' },
];

export default function ManagerDashboard({ initialTab = 'overview', title = 'Manager' }) {
  const [tab, setTab] = useState(initialTab);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);
  const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', leadTimeDays: 2 });
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: 'kg',
    unitCost: 0,
    onHand: 0,
    parLevel: 0,
    vendorId: INITIAL_VENDORS[0]?.id ?? '',
  });
  const [marginInput, setMarginInput] = useState({ cost: 12.5, price: 24 });
  const [wasteLog, setWasteLog] = useState([]);
  const [wasteDraft, setWasteDraft] = useState({ ingredientId: INITIAL_INGREDIENTS[0]?.id ?? '', qty: 0.5, reason: 'Prep waste' });

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

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
      const ingredient = ingredientsById[entry.ingredientId];
      if (!ingredient) return sum;
      return sum + Number(entry.qty) * Number(ingredient.unitCost);
    }, 0);
  }, [wasteLog, ingredientsById]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
    { id: 'vendors', label: 'Vendors', icon: <Building2 size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
    { id: 'costing', label: 'Costing', icon: <Calculator size={18} /> },
    { id: 'reports', label: 'Reports', icon: <Download size={18} /> },
  ];

  const card = 'rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20';
  const input =
    'h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500/70 focus:ring-4';
  const button =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60';
  const buttonSecondary =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:border-orange-500/60';

  const addVendor = () => {
    const name = newVendor.name.trim();
    if (!name) return;
    setVendors((prev) => [
      ...prev,
      {
        id: `v${Date.now()}`,
        name,
        contact: newVendor.contact.trim() || '—',
        leadTimeDays: Math.max(0, Number(newVendor.leadTimeDays) || 0),
        active: true,
      },
    ]);
    setNewVendor({ name: '', contact: '', leadTimeDays: 2 });
  };

  const removeVendor = (vendorId) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    setIngredients((prev) => prev.map((i) => (i.vendorId === vendorId ? { ...i, vendorId: '' } : i)));
  };

  const addIngredient = () => {
    const name = newIngredient.name.trim();
    if (!name) return;
    setIngredients((prev) => [
      ...prev,
      {
        id: `i${Date.now()}`,
        name,
        unit: newIngredient.unit.trim() || 'unit',
        unitCost: Math.max(0, Number(newIngredient.unitCost) || 0),
        onHand: Math.max(0, Number(newIngredient.onHand) || 0),
        parLevel: Math.max(0, Number(newIngredient.parLevel) || 0),
        vendorId: newIngredient.vendorId || '',
      },
    ]);
    setNewIngredient((prev) => ({ ...prev, name: '', unitCost: 0, onHand: 0, parLevel: 0 }));
  };

  const updateIngredient = (ingredientId, patch) =>
    setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i)));

  const logWaste = () => {
    const qty = Number(wasteDraft.qty);
    if (!wasteDraft.ingredientId || !Number.isFinite(qty) || qty <= 0) return;
    setWasteLog((prev) => [
      { id: `w${Date.now()}`, at: new Date().toISOString(), ingredientId: wasteDraft.ingredientId, qty, reason: wasteDraft.reason.trim() || '—' },
      ...prev,
    ]);
    setWasteDraft((prev) => ({ ...prev, qty: 0.5 }));
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
          <p className="text-zinc-400">Vendor & ingredient management, costing/margins, inventory & reports.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.id
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
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${
                      Number(i.onHand) < Number(i.parLevel)
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
                <input className={input} value={newIngredient.name} onChange={(e) => setNewIngredient((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit</label>
                  <input className={input} value={newIngredient.unit} onChange={(e) => setNewIngredient((p) => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit Cost</label>
                  <input className={input} type="number" min="0" step="0.01" value={newIngredient.unitCost} onChange={(e) => setNewIngredient((p) => ({ ...p, unitCost: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">On Hand</label>
                  <input className={input} type="number" min="0" step="0.1" value={newIngredient.onHand} onChange={(e) => setNewIngredient((p) => ({ ...p, onHand: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Par Level</label>
                  <input className={input} type="number" min="0" step="0.1" value={newIngredient.parLevel} onChange={(e) => setNewIngredient((p) => ({ ...p, parLevel: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vendor</label>
                <select className={input} value={newIngredient.vendorId} onChange={(e) => setNewIngredient((p) => ({ ...p, vendorId: e.target.value }))}>
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
                        <button type="button" className={buttonSecondary} onClick={() => setIngredients((prev) => prev.filter((x) => x.id !== i.id))}>
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
    </div>
  );
}
