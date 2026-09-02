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

  function render() {
    currentUserLabel.textContent = currentUser;
    var tasks = getTasks();
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      emptyMessage.hidden = false;
      return;
    }

    emptyMessage.hidden = true;
    tasks.forEach(function (task) {
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
