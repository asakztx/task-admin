(function () {
  'use strict';

  var STORAGE_KEY = 'taskadmin.tasks';

  var form = document.getElementById('task-form');
  var titleInput = document.getElementById('task-title');
  var prioritySelect = document.getElementById('task-priority');
  var confirmation = document.getElementById('confirmation');
  var taskList = document.getElementById('task-list');
  var emptyMessage = document.getElementById('empty-message');

  var validPriorities = ['высокий', 'средний', 'низкий'];

  function createTask(data) {
    return {
      id: data.id != null ? data.id : Date.now().toString(),
      title: data.title.trim(),
      priority: data.priority,
      createdAt: data.createdAt != null ? data.createdAt : new Date().toISOString()
    };
  }

  function getTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var tasks = raw ? JSON.parse(raw) : [];
      return Array.isArray(tasks) ? tasks : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function render() {
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

  render();
})();
