'use client';

// ============================================================
// The pop-up windows every planner page needs:
// edit panel, clash window and the "Task deleted — Undo" message.
// ============================================================

import ClashDialog from './ClashDialog';
import EditTaskPanel from './EditTaskPanel';
import UndoToast from './UndoToast';

export default function TaskOverlays({ actions, lists }) {
  return (
    <>
      {actions.editing && (
        <EditTaskPanel key={actions.editing.id} task={actions.editing} lists={lists} actions={actions} />
      )}
      {actions.clash && <ClashDialog clash={actions.clash} onDecide={actions.decideClash} />}
      {actions.deleted && (
        <UndoToast key={actions.deleted.id} onUndo={actions.undoDelete} onDone={actions.hideUndo} />
      )}
    </>
  );
}
