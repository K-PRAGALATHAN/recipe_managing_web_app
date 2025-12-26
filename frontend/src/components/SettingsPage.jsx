import React, { useEffect, useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { createUser, listUsers } from '../utils/adminApi';

export default function SettingsPage({ session }) {
  const isManager = session?.role === 'Manager';
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('chef');
  const [createError, setCreateError] = useState('');
  const [createOk, setCreateOk] = useState('');

  const canCreate = useMemo(
    () =>
      Boolean(
        isManager &&
          newUsername.trim() &&
          newPassword.trim() &&
          newPassword.length >= 8 &&
          (newRole === 'chef' || newRole === 'cook'),
      ),
    [isManager, newPassword, newRole, newUsername],
  );

  useEffect(() => {
    if (!isManager) return;
    let active = true;
    setUsersError('');
    listUsers()
      .then((data) => {
        if (!active) return;
        setUsers(Array.isArray(data?.users) ? data.users : []);
      })
      .catch((e) => {
        if (!active) return;
        setUsersError(String(e?.message || 'Unable to load users.'));
      });
    return () => {
      active = false;
    };
  }, [isManager]);

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
        {isManager ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg shadow-black/20 lg:col-span-2">
            <p className="text-sm font-bold text-white">User Management</p>
            <p className="mt-2 text-sm text-zinc-400">
              Create Chef/Cook credentials. Role is assigned by the server (not chosen at login).
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tip: Use an email here to also provision a Supabase Auth user (requires backend <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span>).
            </p>

            <form
              className="mt-4 grid gap-3 lg:grid-cols-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setCreateError('');
                setCreateOk('');
                try {
                  const created = await createUser({ username: newUsername.trim(), password: newPassword, role: newRole });
                  setCreateOk(created?.user?.supabaseUserId ? 'User created (database + Supabase Auth).' : 'User created.');
                  setNewUsername('');
                  setNewPassword('');
                  const refreshed = await listUsers();
                  setUsers(Array.isArray(refreshed?.users) ? refreshed.users : []);
                } catch (err) {
                  if (String(err?.message) === 'username_taken') setCreateError('Username already exists.');
                  else if (String(err?.message) === 'supabase_email_taken') setCreateError('Email already exists in Supabase Auth.');
                  else if (String(err?.message) === 'weak_password') setCreateError('Password must be at least 8 characters.');
                  else if (String(err?.message) === 'invalid_role') setCreateError('Invalid role.');
                  else setCreateError('Unable to create user.');
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-zinc-300">Username / Email</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500 focus:ring-4"
                  placeholder="chef1@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500 focus:ring-4"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-zinc-100 outline-none ring-orange-500/30 focus:border-orange-500 focus:ring-4"
                >
                  <option value="chef">chef</option>
                  <option value="cook">cook</option>
                </select>
              </div>

              <div className="lg:col-span-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  {createError ? <span className="text-red-300">{createError}</span> : null}
                  {createOk ? <span className="text-green-300">{createOk}</span> : null}
                </div>
                <button
                  type="submit"
                  disabled={!canCreate}
                  className="h-11 rounded-xl bg-orange-600 px-5 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Create user
                </button>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-xs font-semibold text-zinc-300">Existing users</p>
              {usersError ? <p className="mt-2 text-sm text-red-300">{usersError}</p> : null}
              <div className="mt-2 overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-950">
                    <tr>
                      <th className="px-3 py-2 text-zinc-300">Username</th>
                      <th className="px-3 py-2 text-zinc-300">Role</th>
                      <th className="px-3 py-2 text-zinc-300">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-zinc-900/60">
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-zinc-800">
                        <td className="px-3 py-2 text-zinc-100">{u.username}</td>
                        <td className="px-3 py-2 text-zinc-300">{u.role}</td>
                        <td className="px-3 py-2 text-zinc-500">{u.createdAt}</td>
                      </tr>
                    ))}
                    {users.length === 0 ? (
                      <tr className="border-t border-zinc-800">
                        <td className="px-3 py-3 text-zinc-500" colSpan={3}>
                          No users found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

