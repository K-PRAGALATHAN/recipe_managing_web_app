import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
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
      </div>
    </div>
  );
}

