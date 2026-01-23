import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Building2, Calculator, CheckCircle2, Download, KeyRound, Package, Plus, Trash2, UserPlus, Users, XCircle } from 'lucide-react';
import { createUser } from '../utils/adminApi';
import {
  listVendors, createVendor as apiCreateVendor, updateVendor as apiUpdateVendor, deleteVendor as apiDeleteVendor,
  listIngredients, createIngredient as apiCreateIngredient, updateIngredient as apiUpdateIngredient, deleteIngredient as apiDeleteIngredient
} from '../utils/managerApi';

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

const randomPassword = (length = 16) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

<<<<<<< HEAD


import { getSessionToken } from '../utils/authSession';
=======
const INITIAL_VENDORS = [];
>>>>>>> 37eed91 (Update backend and frontend logic)

export default function ManagerDashboard({ initialTab = 'overview', title = 'Manager' }) {
  const [tab, setTab] = useState(initialTab);
  const [vendors, setVendors] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', leadTimeDays: 2 });
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: 'kg',
    unitCost: 0,
    onHand: 0,
    parLevel: 0,
    vendorId: '',
  });
  const [marginInput, setMarginInput] = useState({ cost: 12.5, price: 24 });
  const [wasteLog, setWasteLog] = useState([]);
  const [wasteDraft, setWasteDraft] = useState({ ingredientId: '', qty: 0.5, reason: 'Prep waste' });
  const [staffDraft, setStaffDraft] = useState({ email: '', password: '', role: 'Cook' });
  const [staffStatus, setStaffStatus] = useState({ kind: '', message: '' });
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createdStaff, setCreatedStaff] = useState([]);
  const [token, setToken] = useState(getSessionToken() || '');
  const [ingredientError, setIngredientError] = useState('');

  // Fetch initial data
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [vRes, iRes, wRes] = await Promise.all([
          fetch('/api/manager/vendors', { headers }),
          fetch('/api/manager/ingredients', { headers }),
          fetch('/api/manager/wastage', { headers })
        ]);

        if (vRes.ok) {
          const data = await vRes.json();
          setVendors(data.vendors || []);
        }
        if (iRes.ok) {
          const data = await iRes.json();
          // Map DB snake_case to frontend camelCase if needed, but we try to keep it consistent
          // The backend routes return objects with snake_case keys for DB columns usually, 
          // let's adjust to what the UI expects (camelCase) or update UI. 
          // UI expects: id, name, unit, unitCost, onHand, parLevel, vendorId
          // Backend sends: id, name, unit, unit_cost, on_hand, par_level, vendor_id
          const items = (data.ingredients || []).map(i => ({
            id: i.id,
            name: i.name,
            unit: i.unit,
            unitCost: i.unit_cost,
            onHand: i.on_hand,
            parLevel: i.par_level,
            vendorId: i.vendor_id
          }));
          setIngredients(items);
        }
        if (wRes.ok) {
          const data = await wRes.json();
          // UI expects: id, at, ingredientId, qty, reason
          // Backend sends: id, created_at, ingredient_id, amount, reason
          const logs = (data.wastage || []).map(w => ({
            id: w.id,
            at: w.created_at,
            ingredientId: w.ingredient_id,
            qty: w.amount,
            reason: w.reason
          }));
          setWasteLog(logs);
        }
      } catch (err) {
        console.error('Failed to fetch manager data', err);
      }
    };

    fetchData();
  }, [token, tab]);

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
    { id: 'staff', label: 'Staff', icon: <Users size={18} /> },
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

<<<<<<< HEAD
  const addVendor = async () => {
    const name = newVendor.name.trim();
    if (!name) return;

    try {
      const res = await fetch('/api/manager/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          contact: newVendor.contact.trim(),
          leadTimeDays: Math.max(0, Number(newVendor.leadTimeDays) || 0),
          active: true
        })
      });
      if (res.ok) {
        const { vendor } = await res.json();
        setVendors(prev => [...prev, vendor]);
        setNewVendor({ name: '', contact: '', leadTimeDays: 2 });
      }
    } catch (e) { console.error(e); }
  };

  const removeVendor = async (vendorId) => {
    if (!confirm('Delete this vendor?')) return;
    try {
      await fetch(`/api/manager/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      // We probably should update ingredients too, but for now just UI side cleaup
      setIngredients((prev) => prev.map((i) => (i.vendorId === vendorId ? { ...i, vendorId: '' } : i)));
    } catch (e) { console.error(e); }
  };

  const toggleVendorStatus = async (vendorId, currentStatus) => {
    try {
      const res = await fetch(`/api/manager/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) {
        setVendors((prev) => prev.map((v) => (v.id === vendorId ? { ...v, active: !currentStatus } : v)));
      }
    } catch (e) { console.error(e); }
=======
  useEffect(() => {
    let cancelled = false;
    if (tab === 'vendors' || tab === 'inventory' || tab === 'overview') {
      Promise.all([listVendors(), listIngredients()])
        .then(([vendorsData, ingredientsData]) => {
          if (!cancelled) {
            setVendors(vendorsData);
            setIngredients(ingredientsData);
          }
        })
        .catch((err) => console.error('[Manager] failed to load data:', err));
    }
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const addVendor = async () => {
    const name = newVendor.name.trim();
    if (!name) return;
    try {
      const created = await apiCreateVendor({
        name,
        contact: newVendor.contact.trim() || '—',
        leadTimeDays: Math.max(0, Number(newVendor.leadTimeDays) || 0),
      });
      setVendors((prev) => [created, ...prev]);
      setNewVendor({ name: '', contact: '', leadTimeDays: 2 });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create vendor');
    }
  };

  const removeVendor = async (vendorId) => {
    if (!window.confirm('Remove this vendor?')) return;
    try {
      await apiDeleteVendor(vendorId);
      setVendors((prev) => prev.filter((v) => v.id !== vendorId));
      // Previously we cleared vendorId from ingredients, but now they are linked in DB which might enforce referential integrity or set null.
      // We'll optimistically update any ingredients in view to clear the vendorId
      setIngredients((prev) => prev.map((i) => (i.vendorId === vendorId ? { ...i, vendorId: null } : i)));
    } catch (err) {
      console.error(err);
      alert('Failed to remove vendor');
    }
  };

  const toggleVendorActive = async (vendorId, currentActive) => {
    try {
      const updated = await apiUpdateVendor(vendorId, { active: !currentActive });
      setVendors((prev) => prev.map((v) => (v.id === vendorId ? updated : v)));
    } catch (err) {
      console.error(err);
      alert('Failed to update vendor');
    }
>>>>>>> 37eed91 (Update backend and frontend logic)
  };

  const addIngredient = async () => {
    const name = newIngredient.name.trim();
    if (!name) return;
<<<<<<< HEAD
    if (!newIngredient.vendorId) {
      setIngredientError('Please select a vendor.');
      return;
    }
    setIngredientError('');

    try {
      const payload = {
=======
    try {
      const created = await apiCreateIngredient({
>>>>>>> 37eed91 (Update backend and frontend logic)
        name,
        unit: newIngredient.unit.trim() || 'unit',
        unitCost: Math.max(0, Number(newIngredient.unitCost) || 0),
        onHand: Math.max(0, Number(newIngredient.onHand) || 0),
        parLevel: Math.max(0, Number(newIngredient.parLevel) || 0),
<<<<<<< HEAD
        vendorId: newIngredient.vendorId || ''
      };

      const res = await fetch('/api/manager/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const { ingredient } = await res.json();
        // Convert back to camelCase for state
        const newItem = {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          unitCost: ingredient.unit_cost,
          onHand: ingredient.on_hand,
          parLevel: ingredient.par_level,
          vendorId: ingredient.vendor_id
        };
        setIngredients((prev) => [...prev, newItem]);
        setNewIngredient((prev) => ({ ...prev, name: '', unitCost: 0, onHand: 0, parLevel: 0 }));
      }
    } catch (e) { console.error(e); }
  };

  const updateIngredient = async (ingredientId, patch) => {
    // patch keys need to be snake_case for API if we are sending them directly,
    // or we handle conversion. The UI passes camelCase.
    const apiPatch = {};
    if (patch.onHand !== undefined) apiPatch.onHand = patch.onHand;
    if (patch.parLevel !== undefined) apiPatch.parLevel = patch.parLevel;
    if (patch.unitCost !== undefined) apiPatch.unitCost = patch.unitCost;
    if (patch.vendorId !== undefined) apiPatch.vendorId = patch.vendorId;

    try {
      const res = await fetch(`/api/manager/ingredients/${ingredientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(apiPatch)
      });

      if (res.ok) {
        const { ingredient } = await res.json();
        // Update local state with the returned (authoritative) data
        const updatedItem = {
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          unitCost: ingredient.unit_cost,
          onHand: ingredient.on_hand,
          parLevel: ingredient.par_level,
          vendorId: ingredient.vendor_id
        };
        setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? updatedItem : i)));
      }
    } catch (e) { console.error(e); }
  };

  const logWaste = async () => {
=======
        vendorId: newIngredient.vendorId || null,
      });
      setIngredients((prev) => [...prev, created]);
      setNewIngredient((prev) => ({ ...prev, name: '', unitCost: 0, onHand: 0, parLevel: 0 }));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create ingredient');
    }
  };

  const removeIngredient = async (id) => {
    if (!window.confirm('Remove this ingredient?')) return;
    try {
      await apiDeleteIngredient(id);
      setIngredients((prev) => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete ingredient');
    }
  };

  // Updates local state immediately for inputs
  const handleIngredientChange = (ingredientId, patch) =>
    setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i)));

  // Persists changes to the server
  const saveIngredient = async (ingredientId, patch) => {
    try {
      const updated = await apiUpdateIngredient(ingredientId, patch);
      setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? updated : i)));
    } catch (err) {
      console.error('[Manager] failed to save ingredient:', err);
      // Optional: revert logic could go here
    }
  };

  const logWaste = () => {
>>>>>>> 37eed91 (Update backend and frontend logic)
    const qty = Number(wasteDraft.qty);
    if (!wasteDraft.ingredientId) {
      alert("Please select an ingredient.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Please enter a valid quantity greater than 0.");
      return;
    }

    try {
      const res = await fetch('/api/manager/wastage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ingredientId: wasteDraft.ingredientId,
          qty,
          reason: wasteDraft.reason.trim() || '-'
        })
      });

      if (res.ok) {
        const { entry } = await res.json();
        const newItem = {
          id: entry.id,
          at: entry.created_at,
          ingredientId: entry.ingredient_id,
          qty: entry.amount,
          reason: entry.reason
        };
        setWasteLog((prev) => [newItem, ...prev]);
        setWasteDraft((prev) => ({ ...prev, qty: 0.5 }));
      } else {
        const err = await res.json();
        alert(`Failed to log waste: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error(e);
      alert(`Error logging waste: ${e.message}`);
    }
  };

  const createStaffUser = async () => {
    setStaffStatus({ kind: '', message: '' });

    const email = staffDraft.email.trim();
    const password = staffDraft.password;
    const role = staffDraft.role;

    if (!email || !isValidEmail(email)) {
      setStaffStatus({ kind: 'error', message: 'Enter a valid email.' });
      return;
    }

    if (!password || password.length < 8) {
      setStaffStatus({ kind: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }

    if (!['Cook', 'Chef'].includes(role)) {
      setStaffStatus({ kind: 'error', message: 'Role must be Cook or Chef.' });
      return;
    }

    try {
      setCreatingStaff(true);
      const normalizedRole = role === 'Chef' ? 'chef' : 'cook';
      const response = await createUser({ username: email, password, role: normalizedRole });
      const created = response?.user;

      setCreatedStaff((prev) => [
        { id: created?.supabaseUserId ?? created?.id ?? `local-${Date.now()}`, email, role, at: new Date().toISOString() },
        ...prev,
      ]);
      setStaffStatus({
        kind: 'success',
        message: created?.supabaseUserId
          ? 'User created in database and Supabase Auth.'
          : 'User created in database. Supabase Auth provisioning is not configured on the backend.',
      });
      setStaffDraft((prev) => ({ ...prev, email: '', password: '' }));
    } catch (err) {
      const message = String(err?.message || 'Unable to create user.');
      if (message === 'username_taken') setStaffStatus({ kind: 'error', message: 'This email is already used as a username.' });
      else if (message === 'supabase_email_taken') setStaffStatus({ kind: 'error', message: 'This email already exists in Supabase Auth.' });
      else if (message === 'invalid_role') setStaffStatus({ kind: 'error', message: 'Role must be Cook or Chef.' });
      else setStaffStatus({ kind: 'error', message });
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
        <p className="text-zinc-400">Vendor & ingredient management, costing/margins, inventory & reports.</p>
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
<<<<<<< HEAD
                          <button type="button" className={buttonSecondary} onClick={() => toggleVendorStatus(v.id, v.active)}>
=======
                          <button type="button" className={buttonSecondary} onClick={() => toggleVendorActive(v.id, v.active)}>
>>>>>>> 37eed91 (Update backend and frontend logic)
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
                {ingredientError && <p className="mt-1 text-xs text-red-400">{ingredientError}</p>}
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
                        <button type="button" className={buttonSecondary} onClick={() => saveIngredient(i.id, { onHand: Math.max(0, Number(i.onHand) - 1) })}>−1</button>
                        <button type="button" className={buttonSecondary} onClick={() => saveIngredient(i.id, { onHand: Number(i.onHand) + 1 })}>+1</button>
                        <button type="button" className={buttonSecondary} onClick={() => removeIngredient(i.id)}>
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">On Hand</label>
                        <input
                          className={input}
                          type="number"
                          min="0"
                          step="0.1"
                          value={i.onHand}
                          onChange={(e) => handleIngredientChange(i.id, { onHand: e.target.value })}
                          onBlur={(e) => saveIngredient(i.id, { onHand: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Par</label>
                        <input
                          className={input}
                          type="number"
                          min="0"
                          step="0.1"
                          value={i.parLevel}
                          onChange={(e) => handleIngredientChange(i.id, { parLevel: e.target.value })}
                          onBlur={(e) => saveIngredient(i.id, { parLevel: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Unit Cost</label>
                        <input
                          className={input}
                          type="number"
                          min="0"
                          step="0.01"
                          value={i.unitCost}
                          onChange={(e) => handleIngredientChange(i.id, { unitCost: e.target.value })}
                          onBlur={(e) => saveIngredient(i.id, { unitCost: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Vendor</label>
                        <select
                          className={input}
                          value={i.vendorId || ''}
                          onChange={(e) => {
                            handleIngredientChange(i.id, { vendorId: e.target.value });
                            // For select, we can save immediately on change as well, or wait for blur.
                            // Typically select is immediate.
                            saveIngredient(i.id, { vendorId: e.target.value });
                          }}
                        >
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
                  <option value="">Select Ingredient...</option>
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

      {tab === 'staff' ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Add Cook / Chef</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Creates a Supabase Auth user via client-side sign up (no backend required).
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
                Roles: <span className="font-semibold text-white">Cook</span>, <span className="font-semibold text-white">Chef</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email</label>
                <input
                  className={input}
                  value={staffDraft.email}
                  onChange={(e) => setStaffDraft((p) => ({ ...p, email: e.target.value }))}
                  placeholder="cook@example.com"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Role</label>
                <select className={input} value={staffDraft.role} onChange={(e) => setStaffDraft((p) => ({ ...p, role: e.target.value }))}>
                  <option value="Cook">Cook</option>
                  <option value="Chef">Chef</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    className={input}
                    value={staffDraft.password}
                    onChange={(e) => setStaffDraft((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={buttonSecondary}
                    onClick={() => setStaffDraft((p) => ({ ...p, password: randomPassword() }))}
                    title="Generate password"
                  >
                    <KeyRound size={16} />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <button type="button" className={button} onClick={createStaffUser} disabled={creatingStaff}>
                  <UserPlus size={16} />
                  {creatingStaff ? 'Creating...' : 'Create user'}
                </button>
                <button
                  type="button"
                  className={buttonSecondary}
                  disabled={!staffDraft.password}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(staffDraft.password || '');
                      setStaffStatus({ kind: 'success', message: 'Password copied to clipboard.' });
                    } catch {
                      setStaffStatus({ kind: 'error', message: 'Unable to copy password (clipboard blocked).' });
                    }
                  }}
                >
                  Copy password
                </button>
              </div>
            </div>

            {staffStatus.message ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-sm ${staffStatus.kind === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-200'
                  }`}
              >
                {staffStatus.message}
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
              Note: This creates staff via the backend Admin API. Supabase Auth provisioning runs only if the backend is configured with
              <span className="font-mono">SUPABASE_URL</span> and <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>.
            </div>
          </div>

          <div className={card}>
            <p className="text-sm font-bold text-white">Recently Added (this session)</p>
            <p className="mt-1 text-xs text-zinc-500">Stored in the backend database; this list shows what you created in this session.</p>

            <div className="mt-4 space-y-2">
              {createdStaff.length ? (
                createdStaff.slice(0, 8).map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{u.email}</p>
                      <p className="text-xs text-zinc-500">{u.role}  {new Date(u.at).toLocaleString()}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-1 text-xs font-bold text-orange-300">
                      {u.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No staff created yet.</p>
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
