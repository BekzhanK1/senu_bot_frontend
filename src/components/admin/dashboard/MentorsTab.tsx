'use client';

import { useState, useEffect } from 'react';
import { Plus, UserPlus, UserMinus, X } from 'lucide-react';
import { buildQuery, requestJson } from './http';
import type { MentorItem, RoleItem } from './types';

type Props = {
  tgUserId: number;
};

export function MentorsTab({ tgUserId }: Props) {
  const [mentors, setMentors] = useState<MentorItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    target_user_id: '',
    display_name: '',
    languages: '',
    skills: '',
  });
  const [assigningRole, setAssigningRole] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const query = buildQuery({ tg_user_id: tgUserId });
      
      const [mentorsData, rolesData] = await Promise.all([
        requestJson<{ items: MentorItem[] }>(`/api/admin/mentors${query}`),
        requestJson<{ items: RoleItem[] }>(`/api/admin/roles${query}`),
      ]);
      
      setMentors(mentorsData.items);
      setRoles(rolesData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.target_user_id || !newForm.display_name) {
      setError('User ID and display name are required');
      return;
    }

    try {
      setError('');
      await requestJson('/api/admin/mentors', {
        method: 'POST',
        body: {
          tg_user_id: tgUserId,
          target_user_id: parseInt(newForm.target_user_id),
          display_name: newForm.display_name,
          languages: newForm.languages || null,
          skills: newForm.skills || null,
        },
      });
      setCreating(false);
      setNewForm({ target_user_id: '', display_name: '', languages: '', skills: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mentor');
    }
  }

  async function handleAssignRole(userId: number) {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      setError('');
      await requestJson(`/api/admin/mentors/${userId}/roles`, {
        method: 'POST',
        body: {
          tg_user_id: tgUserId,
          target_user_id: userId,
          role_name: selectedRole,
        },
      });
      setAssigningRole(null);
      setSelectedRole('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  }

  async function handleRemoveRole(userId: number, roleName: string) {
    if (!confirm(`Remove role "${roleName}"?`)) return;

    try {
      setError('');
      const query = buildQuery({ tg_user_id: tgUserId });
      await requestJson(`/api/admin/mentors/${userId}/roles/${roleName}${query}`, {
        method: 'DELETE',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[var(--tg-theme-hint-color)]">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)]">
          Менторы ({mentors.length})
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">{error}</div>
      )}

      {/* Create Form */}
      {creating && (
        <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">Новый ментор</h3>
            <button onClick={() => setCreating(false)} className="text-[var(--tg-theme-hint-color)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="number"
            placeholder="Telegram ID пользователя"
            value={newForm.target_user_id}
            onChange={(e) => setNewForm({ ...newForm, target_user_id: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <input
            type="text"
            placeholder="Отображаемое имя"
            value={newForm.display_name}
            onChange={(e) => setNewForm({ ...newForm, display_name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <input
            type="text"
            placeholder="Языки (опционально)"
            value={newForm.languages}
            onChange={(e) => setNewForm({ ...newForm, languages: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <textarea
            placeholder="Навыки (опционально)"
            value={newForm.skills}
            onChange={(e) => setNewForm({ ...newForm, skills: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06] resize-none"
          />

          <button
            onClick={handleCreate}
            className="w-full py-2 rounded-xl bg-blue-500 text-white text-sm font-medium"
          >
            Создать
          </button>
        </div>
      )}

      {/* Mentors List */}
      <div className="space-y-2">
        {mentors.length === 0 ? (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)] text-sm">
            Менторы не найдены
          </div>
        ) : (
          mentors.map((mentor) => (
            <div
              key={mentor.user_id}
              className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                      {mentor.display_name}
                    </h3>
                    {!mentor.is_active && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600">
                        Неактивен
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--tg-theme-hint-color)] mb-2">
                    {mentor.full_name}
                    {mentor.username && ` (@${mentor.username})`}
                    {' • '}ID: {mentor.user_id}
                  </p>
                  {mentor.languages && (
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1">
                      🌐 {mentor.languages}
                    </p>
                  )}
                  {mentor.skills && (
                    <p className="text-xs text-[var(--tg-theme-hint-color)]">
                      💼 {mentor.skills}
                    </p>
                  )}
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-[var(--tg-theme-hint-color)]">
                    Роли:
                  </span>
                  {mentor.roles.length === 0 ? (
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">Нет ролей</span>
                  ) : (
                    mentor.roles.map((role) => (
                      <div
                        key={role}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs"
                      >
                        <span>{role}</span>
                        <button
                          onClick={() => handleRemoveRole(mentor.user_id, role)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setAssigningRole(mentor.user_id)}
                    className="text-blue-600 text-xs"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {/* Assign Role Form */}
                {assigningRole === mentor.user_id && (
                  <div className="flex gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      <option value="">Выберите роль</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignRole(mentor.user_id)}
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium"
                    >
                      Назначить
                    </button>
                    <button
                      onClick={() => {
                        setAssigningRole(null);
                        setSelectedRole('');
                      }}
                      className="px-4 py-2 rounded-xl bg-gray-500/10 text-[var(--tg-theme-hint-color)] text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Available Roles */}
      <div className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06]">
        <h3 className="font-semibold text-[var(--tg-theme-text-color)] mb-3">
          Доступные роли
        </h3>
        <div className="flex flex-wrap gap-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 text-sm"
            >
              {role.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
