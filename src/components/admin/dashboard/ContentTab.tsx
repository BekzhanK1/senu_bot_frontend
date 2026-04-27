'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { buildQuery, requestJson } from './http';
import { CONTENT_CATEGORIES, CONTENT_TYPES } from './constants';
import type { DynamicContentItem } from './types';

type Props = {
  tgUserId: number;
};

export function ContentTab({ tgUserId }: Props) {
  const [items, setItems] = useState<DynamicContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<DynamicContentItem>>({});
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState({
    key: '',
    content: '',
    content_type: 'html',
    category: 'general',
    description: '',
  });

  useEffect(() => {
    loadContent();
  }, [filter]);

  async function loadContent() {
    try {
      setLoading(true);
      setError('');
      const query = buildQuery({
        tg_user_id: tgUserId,
        category: filter === 'all' ? undefined : filter,
      });
      const data = await requestJson<{ items: DynamicContentItem[] }>(
        `/api/admin/content${query}`
      );
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.key || !newForm.content) {
      setError('Key and content are required');
      return;
    }

    try {
      setError('');
      await requestJson('/api/admin/content', {
        method: 'POST',
        body: { tg_user_id: tgUserId, ...newForm },
      });
      setCreating(false);
      setNewForm({ key: '', content: '', content_type: 'html', category: 'general', description: '' });
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content');
    }
  }

  async function handleUpdate(key: string) {
    try {
      setError('');
      await requestJson(`/api/admin/content/${key}`, {
        method: 'PUT',
        body: { tg_user_id: tgUserId, ...editForm },
      });
      setEditingId(null);
      setEditForm({});
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  }

  async function handleDelete(key: string) {
    if (!confirm('Delete this content?')) return;

    try {
      setError('');
      const query = buildQuery({ tg_user_id: tgUserId });
      await requestJson(`/api/admin/content/${key}${query}`, { method: 'DELETE' });
      await loadContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
    }
  }

  function startEdit(item: DynamicContentItem) {
    setEditingId(item.id);
    setEditForm({
      content: item.content,
      content_type: item.content_type,
      category: item.category,
      description: item.description || '',
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
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
        >
          <option value="all">Все категории</option>
          {CONTENT_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

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
            <h3 className="font-semibold text-[var(--tg-theme-text-color)]">Новый контент</h3>
            <button onClick={() => setCreating(false)} className="text-[var(--tg-theme-hint-color)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Ключ (например: welcome_message)"
            value={newForm.key}
            onChange={(e) => setNewForm({ ...newForm, key: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <textarea
            placeholder="Содержимое"
            value={newForm.content}
            onChange={(e) => setNewForm({ ...newForm, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06] resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newForm.content_type}
              onChange={(e) => setNewForm({ ...newForm, content_type: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={newForm.category}
              onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
              className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
            >
              {CONTENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Описание (опционально)"
            value={newForm.description}
            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
          />

          <button
            onClick={handleCreate}
            className="w-full py-2 rounded-xl bg-blue-500 text-white text-sm font-medium"
          >
            Создать
          </button>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[var(--tg-theme-hint-color)] text-sm">
            Контент не найден
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
                    <span className="text-xs font-mono text-[var(--tg-theme-hint-color)]">
                      {item.key}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(item.key)}
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

                  <textarea
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06] resize-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editForm.content_type || 'html'}
                      onChange={(e) => setEditForm({ ...editForm, content_type: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      {CONTENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={editForm.category || 'general'}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] text-sm border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      {CONTENT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[var(--tg-theme-hint-color)]">
                          {item.key}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                          {item.content_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-[var(--tg-theme-hint-color)] mb-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-sm text-[var(--tg-theme-text-color)] line-clamp-3">
                        {item.content}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.key)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
