(function () {
  'use strict';

  var USER_KEY = 'taskadmin.currentUser';
  var TASKS_PREFIX = 'taskadmin.tasks.';

  var form = document.getElementById('task-form');
  var titleInput = document.getElementById('task-title');
  var prioritySelect = document.getElementById('task-priority');
  var confirmation = document.getElementById('confirmation');
  var taskList = document.getElementById('task-list');
  var emptyMessage = document.getElementById('empty-message');

  var userForm = document.getElementById('user-form');
  var userNameInput = document.getElementById('user-name');
  var currentUserLabel = document.getElementById('current-user-label');

  var validPriorities = ['высокий', 'средний', 'низкий'];

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

  function createTask(data) {
    return {
      id: data.id != null ? data.id : Date.now().toString(),
      title: data.title.trim(),
      priority: data.priority,
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
      li.className = 'task-item';

      var name = document.createElement('span');
      name.textContent = task.title;

      var badge = document.createElement('span');
      badge.className = 'badge badge--' + task.priority;
      badge.textContent = task.priority;

      li.appendChild(name);
      li.appendChild(badge);
      taskList.appendChild(li);
    });
  }

  function showConfirmation(task) {
    confirmation.hidden = false;
    confirmation.textContent = 'Задача «' + task.title + '» успешно создана.';
    window.setTimeout(function () {
      confirmation.hidden = true;
    }, 3000);
  }

  userForm.addEventListener('submit', function (event) {
    event.preventDefault();

    var name = userNameInput.value.trim();
    if (!name) {
      alert('Укажите имя пользователя.');
      return;
    }

    setCurrentUser(name);
    userNameInput.value = '';
    render();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var title = titleInput.value.trim();
    var priority = prioritySelect.value;

    if (!title) {
      alert('Укажите название задачи.');
      return;
    }

    if (validPriorities.indexOf(priority) === -1) {
      alert('Укажите допустимый приоритет.');
      return;
    }

    var tasks = getTasks();
    var task = createTask({ title: title, priority: priority });

    tasks.push(task);
    saveTasks(tasks);

    titleInput.value = '';
    prioritySelect.value = 'высокий';

    render();
    showConfirmation(task);
  });

  currentUser = getCurrentUser();
  render();
})();
