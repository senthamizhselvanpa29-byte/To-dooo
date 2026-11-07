'use client';

// ============================================================
// The pop-up windows every planner page needs:
// edit panel, clash window, the "Task deleted — Undo" message and
// "How much did you pay?" after ticking a bill task.
// ============================================================

import BillAmountDialog from '../money/BillAmountDialog';
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
      {actions.moneyAsk && (
        <BillAmountDialog key={actions.moneyAsk.task.id} task={actions.moneyAsk.task} bill={actions.moneyAsk.bill} onClose={actions.closeMoneyAsk} />
      )}
      {actions.deleted && (
        <UndoToast key={actions.deleted.id} onUndo={actions.undoDelete} onDone={actions.hideUndo} />
      )}
    </>
  );
}
