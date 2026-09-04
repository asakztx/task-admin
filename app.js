(function () {
  'use strict';

  var USER_KEY = 'taskadmin.currentUser';
  var TASKS_PREFIX = 'taskadmin.tasks.';

  var form = document.getElementById('task-form');
  var titleInput = document.getElementById('task-title');
  var prioritySelect = document.getElementById('task-priority');
  var startInput = document.getElementById('task-start');
  var taskIdInput = document.getElementById('task-id');
  var submitButton = document.getElementById('task-submit');
  var cancelButton = document.getElementById('task-cancel');
  var confirmation = document.getElementById('confirmation');
  var taskList = document.getElementById('task-list');
  var emptyMessage = document.getElementById('empty-message');
  var noMatchMessage = document.getElementById('no-match-message');
  var taskStats = document.getElementById('task-stats');
  var searchInput = document.getElementById('task-search');
  var filterSelect = document.getElementById('task-filter');
  var sortSelect = document.getElementById('task-sort');
  var exportButton = document.getElementById('task-export');
  var importInput = document.getElementById('task-import');

  var userForm = document.getElementById('user-form');
  var userNameInput = document.getElementById('user-name');
  var currentUserLabel = document.getElementById('current-user-label');

  var validPriorities = ['высокий', 'средний', 'низкий'];

  var priorityColors = {
    'высокий': 'danger',
    'средний': 'warning',
    'низкий': 'success'
  };

  var currentUser;

  function getCurrentUser() {
    var stored = localStorage.getItem(USER_KEY);
    return stored ? stored : 'Гость';
  }

  function setCurrentUser(name) {
    currentUser = name.trim();
    localStorage.setItem(USER_KEY, currentUser);
  }

  function storageKey() {
    return TASKS_PREFIX + currentUser;
  }

  function generateId() {
    return Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function createTask(data) {
    return {
      id: data.id != null ? data.id : generateId(),
      title: data.title.trim(),
      priority: data.priority,
      startDate: data.startDate != null ? data.startDate : '',
      done: data.done === true,
      owner: currentUser,
      createdAt: data.createdAt != null ? data.createdAt : new Date().toISOString()
    };
  }

  function getTasks() {
    try {
      var raw = localStorage.getItem(storageKey());
      var tasks = raw ? JSON.parse(raw) : [];
      return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(storageKey(), JSON.stringify(tasks));
  }

  function visibleTasks(tasks) {
    var query = searchInput.value.trim().toLowerCase();
    var status = filterSelect.value;

    return tasks.filter(function (task) {
      if (status === 'done' && !task.done) {
        return false;
      }
      if (status === 'active' && task.done) {
        return false;
      }
      if (query && task.title.toLowerCase().indexOf(query) === -1) {
        return false;
      }
      return true;
    });
  }

  function statsText(tasks) {
    var done = 0;
    tasks.forEach(function (task) {
      if (task.done) {
        done++;
      }
    });
    return 'Всего: ' + tasks.length + ' • Выполнено: ' + done;
  }

  var priorityRank = {
    'высокий': 0,
    'средний': 1,
    'низкий': 2
  };

  function sortTasks(tasks) {
    var mode = sortSelect.value;
    var sorted = tasks.slice();

    sorted.sort(function (a, b) {
      if (mode === 'priority') {
        var ra = priorityRank[a.priority] != null ? priorityRank[a.priority] : 3;
        var rb = priorityRank[b.priority] != null ? priorityRank[b.priority] : 3;
        if (ra !== rb) {
          return ra - rb;
        }
        return (a.title || '').localeCompare(b.title || '', 'ru');
      }
      if (mode === 'start') {
        var sa = a.startDate || '';
        var sb = b.startDate || '';
        if (sa !== sb) {
          if (sa === '') {
            return 1;
          }
          if (sb === '') {
            return -1;
          }
          return sa < sb ? -1 : 1;
        }
        return (a.title || '').localeCompare(b.title || '', 'ru');
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return sorted;
  }

  function render() {
    currentUserLabel.textContent = currentUser;
    var tasks = getTasks();
    var filtered = sortTasks(visibleTasks(tasks));
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      emptyMessage.hidden = false;
      noMatchMessage.hidden = true;
      taskStats.textContent = 'Задач пока нет';
    } else if (filtered.length === 0) {
      emptyMessage.hidden = true;
      noMatchMessage.hidden = false;
      taskStats.textContent = statsText(tasks);
    } else {
      emptyMessage.hidden = true;
      noMatchMessage.hidden = true;
      taskStats.textContent = statsText(tasks);
    }

    filtered.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'list-group-item d-flex align-items-center gap-2 flex-wrap' + (task.done ? ' task-item--done' : '');

      var main = document.createElement('div');
      main.className = 'd-flex flex-column flex-grow-1';

      var name = document.createElement('span');
      name.className = 'task-name';
      name.textContent = task.title;

      var meta = document.createElement('span');
      meta.className = 'text-muted small';
      if (task.startDate) {
        meta.textContent = 'Старт: ' + task.startDate;
      }

      main.appendChild(name);
      main.appendChild(meta);

      var badge = document.createElement('span');
      badge.className = 'badge rounded-pill text-bg-' + (priorityColors[task.priority] || 'secondary');
      badge.textContent = task.priority;

      var done = document.createElement('button');
      done.type = 'button';
      done.className = task.done ? 'btn btn-outline-warning btn-sm' : 'btn btn-outline-success btn-sm';
      done.textContent = task.done ? 'Вернуть' : 'Готово';
      done.dataset.id = task.id;
      done.dataset.action = 'done';

      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-outline-primary btn-sm';
      edit.textContent = 'Изменить';
      edit.dataset.id = task.id;
      edit.dataset.action = 'edit';

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-outline-danger btn-sm';
      remove.textContent = 'Удалить';
      remove.dataset.id = task.id;
      remove.dataset.action = 'remove';

      li.appendChild(main);
      li.appendChild(badge);
      li.appendChild(done);
      li.appendChild(edit);
      li.appendChild(remove);
      taskList.appendChild(li);
    });
  }

  var messageTimer;

  function showMessage(text, type) {
    type = type || 'success';
    confirmation.classList.remove('alert-success', 'alert-danger');
    confirmation.classList.add(type === 'error' ? 'alert-danger' : 'alert-success');
    confirmation.hidden = false;
    confirmation.textContent = text;
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(function () {
      confirmation.hidden = true;
    }, 3000);
  }

  function findTaskIndex(tasks, id) {
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function deleteTask(id) {
    var tasks = getTasks();
    var index = findTaskIndex(tasks, id);
    if (index === -1) {
      return false;
    }

    tasks.splice(index, 1);
    saveTasks(tasks);
    render();
    return true;
  }

  var EDITABLE_FIELDS = ['title', 'priority', 'startDate', 'done'];

  function updateTask(id, updates) {
    var tasks = getTasks();
    var index = findTaskIndex(tasks, id);
    if (index === -1) {
      return false;
    }

    var task = tasks[index];
    EDITABLE_FIELDS.forEach(function (field) {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });
    saveTasks(tasks);
    render();
    return true;
  }

  function startEditing(task) {
    taskIdInput.value = task.id;
    titleInput.value = task.title;
    prioritySelect.value = task.priority;
    startInput.value = task.startDate || '';
    submitButton.textContent = 'Сохранить изменения';
    cancelButton.hidden = false;
    titleInput.focus();
  }

  function resetForm() {
    taskIdInput.value = '';
    titleInput.value = '';
    prioritySelect.value = 'высокий';
    startInput.value = '';
    submitButton.textContent = 'Сохранить';
    cancelButton.hidden = true;
  }

  function downloadFile(name, content) {
    var blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function sanitizeImported(value) {
    if (!Array.isArray(value)) {
      return null;
    }
    var result = [];
    value.forEach(function (item) {
      if (!item || typeof item.title !== 'string' || !item.title.trim()) {
        return;
      }
      var priority = validPriorities.indexOf(item.priority) !== -1 ? item.priority : 'средний';
      result.push({
        id: typeof item.id === 'string' ? item.id : generateId(),
        title: item.title.trim(),
        priority: priority,
        startDate: typeof item.startDate === 'string' ? item.startDate : '',
        done: item.done === true,
        owner: currentUser,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString()
      });
    });
    return result;
  }

  exportButton.addEventListener('click', function () {
    var tasks = getTasks();
    downloadFile('taskadmin-' + currentUser + '.json', JSON.stringify(tasks, null, 2));
    showMessage('Экспортировано задач: ' + tasks.length + '.');
  });

  importInput.addEventListener('change', function () {
    var file = importInput.files && importInput.files[0];
    importInput.value = '';
    if (!file) {
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      var tasks;
      try {
        tasks = sanitizeImported(JSON.parse(String(reader.result)));
      } catch (e) {
        showMessage('Некорректный файл импорта.', 'error');
        return;
      }
      if (tasks === null) {
        showMessage('Некорректный файл импорта.', 'error');
        return;
      }
      saveTasks(tasks);
      resetForm();
      render();
      showMessage('Импортировано задач: ' + tasks.length + '.');
    };
    reader.readAsText(file, 'utf-8');
  });

  taskList.addEventListener('click', function (event) {
    var target = event.target.closest ? event.target.closest('button[data-action]') : null;
    if (!target) {
      return;
    }

    var id = target.dataset.id;
    var action = target.dataset.action;

    if (action === 'remove') {
      var deleted = deleteTask(id);
      showMessage(deleted ? 'Задача удалена.' : 'Задача не найдена.', deleted ? 'success' : 'error');
      return;
    }

    if (action === 'edit') {
      var tasks = getTasks();
      var index = findTaskIndex(tasks, id);
      if (index === -1) {
        showMessage('Задача не найдена.', 'error');
        return;
      }
      startEditing(tasks[index]);
      return;
    }

    if (action === 'done') {
      var current = getTasks();
      var idx = findTaskIndex(current, id);
      if (idx === -1) {
        showMessage('Задача не найдена.', 'error');
        return;
      }
      var isDone = !current[idx].done;
      updateTask(id, { done: isDone });
      showMessage(isDone ? 'Задача отмечена как выполненная.' : 'Задача возвращена в работу.');
    }
  });

  cancelButton.addEventListener('click', function () {
    resetForm();
  });

  searchInput.addEventListener('input', render);
  filterSelect.addEventListener('change', render);
  sortSelect.addEventListener('change', render);

  userForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = userNameInput.value.trim();
    if (!name) {
      alert('Укажите имя пользователя.');
      return;
    }

    setCurrentUser(name);
    userNameInput.value = '';
    resetForm();
    render();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var title = titleInput.value.trim();
    var priority = prioritySelect.value;
    var startDate = startInput.value;
    var editingId = taskIdInput.value;

    if (!title) {
      alert('Укажите название задачи.');
      return;
    }

    if (validPriorities.indexOf(priority) === -1) {
      alert('Укажите допустимый приоритет.');
      return;
    }

    if (editingId) {
      var updated = updateTask(editingId, { title: title, priority: priority, startDate: startDate });
      if (!updated) {
        alert('Задача не найдена.');
        return;
      }
      resetForm();
      showMessage('Задача «' + title + '» успешно изменена.');
      return;
    }

    var tasks = getTasks();
    var task = createTask({ title: title, priority: priority, startDate: startDate });

    tasks.push(task);
    saveTasks(tasks);

    resetForm();
    render();
    showMessage('Задача «' + task.title + '» успешно создана.');
  });

  currentUser = getCurrentUser();
  render();
})();
