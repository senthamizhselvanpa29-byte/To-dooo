'use client';

// ============================================================
// LISTS — group tasks into lists like 🏠 Home, 💼 Work, 📚 Study.
//   • Row of lists at the top (tap one to open it)
//   • "＋ New list": pick an icon, type a name, Create
//   • Open list: its tasks, add a task straight into it,
//     rename or delete the list (its tasks stay, without a list)
// (Free: 3 lists, Pro: unlimited — the limit comes with payments in Week 6.)
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createList, deleteList, fetchListTasks, taskErrorKey, updateList, withPlanDetails } from '@/lib/tasks';
import { usePreferences } from '../Preferences';
import { ChevronIcon, PlusIcon, TrashIcon } from '../Icons';
import AddTaskForm from '../tasks/AddTaskForm';
import { Chip } from '../tasks/TaskFields';
import TaskItem from '../tasks/TaskItem';
import TaskOverlays from '../tasks/TaskOverlays';
import TaskSection from '../tasks/TaskSection';
import { useLists } from '../tasks/useLists';
import { useTaskActions } from '../tasks/useTaskActions';

// Icons to choose from for a new list
const LIST_EMOJIS = ['📁', '🏠', '💼', '📚', '💪', '🛒', '✈️', '❤️', '🎯', '🎉', '💰', '🙏'];

export default function ListsBoard() {
  const { t } = usePreferences();
  const { lists, listsById, reloadLists } = useLists();
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  // Open the first list automatically
  useEffect(() => {
    if (!selectedId && lists.length > 0) setSelectedId(lists[0].id);
    if (selectedId && lists.length > 0 && !listsById[selectedId]) setSelectedId(lists[0].id);
  }, [lists, listsById, selectedId]);

  const selected = selectedId ? listsById[selectedId] : null;

  async function handleCreate({ name, emoji }) {
    setErrorKey(null);
    try {
      const list = await createList({ name, emoji });
      await reloadLists();
      setSelectedId(list.id);
      setCreating(false);
    } catch (error) {
      setErrorKey(taskErrorKey(error));
    }
  }

  return (
    <div className="today-board">
      <div className="page-head">
        <h1>{t('navLists')}</h1>
        <button type="button" className="save-btn small" onClick={() => setCreating((v) => !v)}>
          <PlusIcon /> {t('newList')}
        </button>
      </div>

      {errorKey && (
        <div className="form-alert error" role="alert">
          {t(errorKey)}
        </div>
      )}

      {creating && <NewListForm onCreate={handleCreate} onCancel={() => setCreating(false)} />}

      {lists.length === 0 && !creating && <p className="empty-state">{t('noLists')}</p>}

      {lists.length > 0 && (
        <div className="list-tabs" role="tablist">
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              role="tab"
              aria-selected={list.id === selectedId}
              className={`list-tab${list.id === selectedId ? ' active' : ''}`}
              onClick={() => setSelectedId(list.id)}
            >
              <span aria-hidden="true">{list.emoji}</span> {list.name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ListDetail
          key={selected.id}
          list={selected}
          lists={lists}
          listsById={listsById}
          onListsChanged={reloadLists}
          onError={setErrorKey}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------
// New list: icon + name
// ------------------------------------------------------------
function NewListForm({ onCreate, onCancel, initial }) {
  const { t } = usePreferences();
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.emoji || LIST_EMOJIS[0]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    await onCreate({ name: name.trim(), emoji });
    setBusy(false);
  }

  return (
    <form className="new-list card" onSubmit={handleSubmit} noValidate>
      <span className="field-group-label">{t('chooseEmoji')}</span>
      <div className="chip-row" role="radiogroup" aria-label={t('chooseEmoji')}>
        {LIST_EMOJIS.map((e) => (
          <Chip key={e} role="radio" active={emoji === e} className="emoji-chip" onClick={() => setEmoji(e)}>
            {e}
          </Chip>
        ))}
      </div>
      <input
        className="edit-title-input"
        placeholder={t('listNamePlaceholder')}
        aria-label={t('listNamePlaceholder')}
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="edit-panel-actions">
        <span className="spacer" />
        <button type="button" className="ghost-btn" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button type="submit" className="save-btn" disabled={!name.trim() || busy}>
          {initial ? t('saveTask') : t('createList')}
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------
// One open list: its tasks + rename / delete
// ------------------------------------------------------------
function ListDetail({ list, lists, listsById, onListsChanged, onError }) {
  const { t } = usePreferences();
  const [now, setNow] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => setNow(new Date()), []);

  const reload = useCallback(async () => {
    try {
      setTasks(await withPlanDetails(await fetchListTasks(list.id)));
    } catch (error) {
      setTasks((current) => current || []);
      onError(taskErrorKey(error));
    }
  }, [list.id, onError]);

  useEffect(() => {
    reload();
  }, [reload]);

  const actions = useTaskActions({ tasks, setTasks, reload });

  const open = useMemo(() => (tasks || []).filter((x) => !x.done), [tasks]);
  const completed = useMemo(() => (tasks || []).filter((x) => x.done), [tasks]);

  async function handleRename({ name, emoji }) {
    try {
      await updateList(list.id, { name, emoji });
      await onListsChanged();
      setRenaming(false);
    } catch (error) {
      onError(taskErrorKey(error));
    }
  }

  async function handleDelete() {
    if (!window.confirm(t('deleteListConfirm'))) return;
    try {
      await deleteList(list.id);
      await onListsChanged();
    } catch (error) {
      onError(taskErrorKey(error));
    }
  }

  if (!tasks || !now) {
    return (
      <p className="loading-text" role="status">
        {t('loadingTasks')}
      </p>
    );
  }

  const item = (task) => (
    <TaskItem
      key={task.id}
      task={task}
      now={now}
      showDay
      listsById={listsById}
      onToggle={actions.toggle}
      onOpen={actions.open}
    />
  );

  return (
    <>
      <div className="list-actions">
        <button type="button" className="ghost-btn small" onClick={() => setRenaming((v) => !v)}>
          {t('renameList')}
        </button>
        <button type="button" className="delete-btn small" onClick={handleDelete}>
          <TrashIcon /> {t('deleteList')}
        </button>
      </div>

      {renaming && <NewListForm initial={list} onCreate={handleRename} onCancel={() => setRenaming(false)} />}

      {actions.errorKey && (
        <div className="form-alert error" role="alert">
          {t(actions.errorKey)}
        </div>
      )}

      <AddTaskForm onAdd={(fields) => actions.save(fields)} lists={lists} defaults={{ listId: list.id }} />

      <TaskSection title={`${list.emoji} ${list.name}`} count={open.length}>
        {open.length === 0 ? <li className="empty-state">{t('listEmpty')}</li> : open.map(item)}
      </TaskSection>

      {completed.length > 0 && (
        <section className="task-section">
          <button
            type="button"
            className={`section-toggle${showCompleted ? ' open' : ''}`}
            aria-expanded={showCompleted}
            onClick={() => setShowCompleted((v) => !v)}
          >
            <ChevronIcon className="section-chevron" />
            {t('sectionCompleted')} ({completed.length})
          </button>
          {showCompleted && <ul className="task-list">{completed.map(item)}</ul>}
        </section>
      )}

      <TaskOverlays actions={actions} lists={lists} />
    </>
  );
}
