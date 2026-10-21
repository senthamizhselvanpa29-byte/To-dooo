const STORAGE_KEY = 'todooo.tasks';

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-date');
const priorityInput = document.getElementById('task-priority');
const list = document.getElementById('task-list');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const clearDone = document.getElementById('clear-done');
const filterButtons = document.querySelectorAll('.filters button');

let tasks = load();
let filter = 'all';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage unavailable (e.g. private mode); keep working in memory.
  }
}

// Local date as YYYY-MM-DD, matching the <input type="date"> value format.
function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function visibleTasks() {
  const today = todayISO();
  return tasks
    .filter((t) => {
      if (filter === 'done') return t.done;
      if (filter === 'today') return !t.done && t.due && t.due <= today;
      if (filter === 'upcoming') return !t.done && t.due && t.due > today;
      return true;
    })
    .sort((a, b) =>
      (a.done - b.done) ||
      ((a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : 0) ||
      (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    );
}

function render() {
  const today = todayISO();
  list.innerHTML = '';

  for (const task of visibleTasks()) {
    const li = document.createElement('li');
    li.className = `task ${task.priority}${task.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Mark complete');
    checkbox.addEventListener('change', () => update(task.id, { done: checkbox.checked }));

    const body = document.createElement('div');
    body.className = 'task-body';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const priorityLabel = task.priority[0].toUpperCase() + task.priority.slice(1);
    if (task.due) {
      const due = document.createElement('span');
      due.textContent = formatDate(task.due);
      if (!task.done && task.due < today) {
        due.className = 'overdue';
        due.textContent += ' · overdue';
      }
      meta.append(due, ` · ${priorityLabel}`);
    } else {
      meta.textContent = priorityLabel;
    }

    body.append(title, meta);

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.addEventListener('click', () => {
      const next = prompt('Edit task', task.title);
      if (next && next.trim()) update(task.id, { title: next.trim() });
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Delete';
    remove.addEventListener('click', () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      save();
      render();
    });

    li.append(checkbox, body, edit, remove);
    list.append(li);
  }

  empty.hidden = list.children.length > 0;
  const remaining = tasks.filter((t) => !t.done).length;
  count.textContent = `${remaining} task${remaining === 1 ? '' : 's'} left`;
  clearDone.hidden = !tasks.some((t) => t.done);
}

function update(id, changes) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...changes } : t));
  save();
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  tasks.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title,
    due: dateInput.value || null,
    priority: priorityInput.value,
    done: false,
    createdAt: Date.now(),
  });
  save();
  form.reset();
  priorityInput.value = 'medium';
  titleInput.focus();
  render();
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });
});

clearDone.addEventListener('click', () => {
  tasks = tasks.filter((t) => !t.done);
  save();
  render();
});

document.getElementById('today').textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'long', month: 'long', day: 'numeric',
});

render();
