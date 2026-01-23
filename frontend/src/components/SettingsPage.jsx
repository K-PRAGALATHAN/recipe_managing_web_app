import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { changePassword } from '../utils/authApi';

export default function SettingsPage({ session }) {
  const [passwordState, setPasswordState] = useState({
    current: '',
    new: '',
    confirm: '',
    error: '',
    success: '',
    loading: false,
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { current, new: newPass, confirm } = passwordState;

    if (!current || !newPass || !confirm) {
      setPasswordState(prev => ({ ...prev, error: 'All fields are required.' }));
      return;
    }
    if (newPass !== confirm) {
      setPasswordState(prev => ({ ...prev, error: 'New passwords do not match.' }));
      return;
    }
    if (newPass.length < 8) {
      setPasswordState(prev => ({ ...prev, error: 'Password must be at least 8 characters.' }));
      return;
    }

    try {
      setPasswordState(prev => ({ ...prev, loading: true, error: '', success: '' }));
      await changePassword({ currentPassword: current, newPassword: newPass });
      setPasswordState({
        current: '',
        new: '',
        confirm: '',
        error: '',
        success: 'Password changed successfully. Please log in again next time.',
        loading: false,
      });
    } catch (err) {
      setPasswordState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to change password.' }));
    }
  };

  const inputClass = "mt-1 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500 focus:ring-4";

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-600/15 ring-1 ring-orange-500/20">
          <Settings className="h-6 w-6 text-orange-400" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Settings</h1>
          <p className="text-sm text-zinc-400">Account and application preferences.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20">
          <p className="text-sm font-bold text-white">Profile</p>
          <p className="mt-2 text-sm text-zinc-400">Settings UI can be wired to your backend when ready.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20">
          <p className="text-sm font-bold text-white">Preferences</p>
          <p className="mt-2 text-sm text-zinc-400">Add theme, notifications, and kitchen defaults here.</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20 lg:col-span-2">
          <p className="text-sm font-bold text-white">Change Password</p>
          <p className="mt-2 text-sm text-zinc-400">
            Update your account password.
          </p>

          <form className="mt-4 grid gap-4 max-w-md" onSubmit={handleChangePassword}>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Current Password</label>
              <input
                type="password"
                className={inputClass}
                value={passwordState.current}
                onChange={(e) => setPasswordState(prev => ({ ...prev, current: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">New Password</label>
              <input
                type="password"
                className={inputClass}
                value={passwordState.new}
                onChange={(e) => setPasswordState(prev => ({ ...prev, new: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300">Confirm New Password</label>
              <input
                type="password"
                className={inputClass}
                value={passwordState.confirm}
                onChange={(e) => setPasswordState(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            {passwordState.error && <p className="text-sm text-red-400">{passwordState.error}</p>}
            {passwordState.success && <p className="text-sm text-emerald-400">{passwordState.success}</p>}

            <button
              type="submit"
              disabled={passwordState.loading}
              className="h-11 rounded-xl bg-orange-600 px-5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {passwordState.loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

