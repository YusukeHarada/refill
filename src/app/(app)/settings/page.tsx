'use client';

import { useState } from 'react';
import { Copy, Check, LogOut, Users, Plus, Hash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/hooks/useHousehold';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user, profile, signOutUser } = useAuth();
  const { household, createHousehold, joinHousehold, regenerateInviteCode } = useHousehold(profile?.householdId);

  const [householdName, setHouseholdName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateHousehold() {
    if (!user || !householdName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createHousehold(user.uid, householdName.trim());
      setHouseholdName('');
    } catch {
      setError('作成に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin() {
    if (!user || !inviteInput.trim()) return;
    setSaving(true);
    setError('');
    try {
      await joinHousehold(user.uid, inviteInput.trim());
      setInviteInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加に失敗しました');
    } finally {
      setSaving(false);
    }
  }

  async function copyInviteCode() {
    if (!household) return;
    await navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-safe-top pt-4 pb-2">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">設定</h1>
      </div>

      <div className="px-4 pb-8 flex flex-col gap-4">
        {/* User info */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {user?.displayName?.[0] ?? '?'}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">{user?.displayName}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>

        {/* Household */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">家族・世帯</h2>
          </div>

          {household ? (
            <div className="px-4 py-4 flex flex-col gap-4">
              <div>
                <p className="text-sm text-zinc-500 mb-1">世帯名</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{household.name}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 mb-2">招待コード</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
                    <Hash className="w-4 h-4 text-zinc-400" />
                    <span className="text-lg font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
                      {household.inviteCode}
                    </span>
                  </div>
                  <Button variant="secondary" size="icon" onClick={copyInviteCode}>
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">このコードを家族に共有してください</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-xs text-zinc-400"
                onClick={() => household && regenerateInviteCode(household.id)}
              >
                コードを再生成
              </Button>
            </div>
          ) : (
            <div className="px-4 py-4 flex flex-col gap-4">
              {/* Create */}
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">新しい世帯を作成</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="例: 田中家"
                    className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button size="sm" onClick={handleCreateHousehold} disabled={!householdName.trim() || saving}>
                    <Plus className="w-4 h-4" />
                    作成
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                <span className="text-xs text-zinc-400">または</span>
                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
              </div>

              {/* Join */}
              <div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">招待コードで参加</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                    placeholder="招待コード"
                    maxLength={6}
                    className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button size="sm" onClick={handleJoin} disabled={inviteInput.length < 6 || saving}>
                    参加
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <Button variant="danger" onClick={signOutUser} className="w-full">
          <LogOut className="w-4 h-4" />
          ログアウト
        </Button>
      </div>
    </div>
  );
}
