'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { buildQuery, requestJson } from './http';
import { ACTION_TYPES } from './constants';
import type { MenuButtonItem } from './types';

type Props = {
  tgUserId: number;
};

export function MenuTab({ tgUserId }: Props) {
  const [items, setItems] = useState<MenuButtonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuButtonItem>>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    text: '',
    action_type: 'command',
    action_value: '',
    position: 0,
    icon: '',
    required_role: '',
  });

  useEffect(() => {
    loadButtons();
  }, []);

  async function loadButtons() {
    try {
      setLoading(true);
      setError('');
      const query = buildQuery({ tg_user_id: tgUserId });
      const data = await requestJson<{ items: MenuButtonItem[] }>(
        `/api/admin/menu-buttons${query}`
      );
      setItems(data.items.sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load buttons');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.text || !newForm.action_value) {
      setError('Text and action value are required');
      return;
    }

    try {
      setError('');
      await requestJson('/api/admin/menu-buttons', {
        method: 'POST',
        body: {
          tg_user_id: tgUserId,
          ...newForm,
          required_role: newForm.required_role || null,
        },
      });
      setCreating(false);
      setNewForm({
        text: '',
        action_type: 'command',
        action_value: '',
        position: 0,
        icon: '',
        required_role: '',
      });
      await loadButtons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create button');
    }
  }

  async function handleUpdate(id: number) {
    try {
      setError('');
      await requestJson(`/api/admin/menu-buttons/${id}`, {
        method: 'PUT',
        body: {
          tg_user_id: tgUserId,
          ...editForm,
          required_role: editForm.required_role || null,
        },
      });
      setEditingId(null);
      setEditForm({});
      await loadButtons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update button');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this button?')) return;

    try {
      setError('');
      const query = buildQuery({ tg_user_id: tgUserId });
      await requestJson(`/api/admin/menu-buttons/${id}${query}`, { method: 'DELETE' });
      await loadButtons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete button');
    }
  }

  async function toggleActive(id: number, isActive: boolean) {
    try {
      setError('');
      await requestJson(`/api/admin/menu-buttons/${id}`, {
        method: 'PUT',
        body: { tg_user_id: tgUserId, is_active: !isActive },
      });
      await loadButtons();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle button');
    }
  }

  function startEdit(item: MenuButtonItem) {
    setEditingId(item.id);
    setEditForm({
      text: item.text,
      action_type: item.action_type,
      action_value: item.action_value,
      position: item.position,
      icon: item.icon || '',
      required_role: item.required_role || '',
    });
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
          Кнопки меню ({items.length})
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
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">Новая кнопка</h3>
            <button onClick={() => setCreating(false)} className="text-[var(--tg-theme-hint-color)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Текст кнопки (например: 📅 Запись на встречу)"
            value={newForm.text}
            onChange={(e) => setNewForm({ ...newForm, text: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newForm.action_type}
              onChange={(e) => setNewForm({ ...newForm, action_type: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            >
              {ACTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Позиция"
              value={newForm.position}
              onChange={(e) => setNewForm({ ...newForm, position: parseInt(e.target.value) || 0 })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            />
          </div>

          <input
            type="text"
            placeholder="Значение действия (например: meeting_start)"
            value={newForm.action_value}
            onChange={(e) => setNewForm({ ...newForm, action_value: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Иконка (опционально)"
              value={newForm.icon}
              onChange={(e) => setNewForm({ ...newForm, icon: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            />

            <input
              type="text"
              placeholder="Роль (опционально)"
              value={newForm.required_role}
              onChange={(e) => setNewForm({ ...newForm, required_role: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            />
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-2 rounded-xl bg-blue-500 text-white text-sm font-medium"
          >
            Создать
          </button>
        </div>
      )}

      {/* Button List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)] text-sm">
            Кнопки не найдены
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[var(--tg-theme-secondary-bg-color)] border border-black/[0.04] dark:border-white/[0.06]"
            >
              {editingId === item.id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">
                      ID: {item.id}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="text-green-600"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="text-[var(--tg-theme-hint-color)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={editForm.text || ''}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editForm.action_type || 'command'}
                      onChange={(e) => setEditForm({ ...editForm, action_type: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      {ACTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={editForm.position || 0}
                      onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                    />
                  </div>

                  <input
                    type="text"
                    value={editForm.action_value || ''}
                    onChange={(e) => setEditForm({ ...editForm, action_value: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-[var(--tg-theme-hint-color)]">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                        {item.text}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                        {item.action_type}
                      </span>
                      {item.required_role && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                          {item.required_role}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--tg-theme-hint-color)]">
                      {item.action_value} • Позиция: {item.position}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(item.id, true)}
                      className="text-[var(--tg-theme-hint-color)]"
                      title="Toggle visibility"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
