// @ts-check
const { test, expect } = require('@playwright/test');

const URL = '/';
const USER_KEY = 'taskadmin.currentUser';
const TASKS_PREFIX = 'taskadmin.tasks.';

async function createTask(page, title, priority, startDate) {
  await page.fill('#task-title', title);
  if (priority) {
    await page.selectOption('#task-priority', priority);
  }
  if (startDate) {
    await page.fill('#task-start', startDate);
  }
  await page.click('#task-submit');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ userKey, tasksPrefix }) => {
    localStorage.clear();
  }, { userKey: USER_KEY, tasksPrefix: TASKS_PREFIX });
  await page.goto(URL);
});

test('создание задачи отображается в списке', async ({ page }) => {
  await createTask(page, 'Подготовить отчёт', 'высокий', '2023-08-31');
  await expect(page.locator('#task-list .task-name')).toHaveText('Подготовить отчёт');
  await expect(page.locator('#task-list .badge')).toHaveText('высокий');
  await expect(page.locator('#confirmation')).toContainText('успешно создана');
});

test('создание задачи с датой начала', async ({ page }) => {
  await createTask(page, 'Планёрка', 'средний', '2023-09-01');
  await expect(page.locator('#task-list .task-name')).toHaveText('Планёрка');
  await expect(page.locator('#task-list .text-muted')).toHaveText('Старт: 2023-09-01');
  await expect(page.locator('#confirmation')).toContainText('успешно создана');
});

test('просмотр списка задач', async ({ page }) => {
  await createTask(page, 'Задача 1', 'высокий');
  await createTask(page, 'Задача 2', 'средний');
  await createTask(page, 'Задача 3', 'низкий');
  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Задача 1',
    'Задача 2',
    'Задача 3',
  ]);
});

test('пустой список задач', async ({ page }) => {
  await expect(page.locator('#empty-message')).toBeVisible();
  await expect(page.locator('#task-list .task-name')).toHaveCount(0);
});

test('редактирование задачи', async ({ page }) => {
  await createTask(page, 'Подготовить отчёт', 'высокий');
  await page.click('button[data-action="edit"]');
  await expect(page.locator('#task-submit')).toHaveText('Сохранить изменения');
  await page.fill('#task-title', 'Подготовить итоговый отчёт');
  await page.selectOption('#task-priority', 'средний');
  await page.click('#task-submit');
  await expect(page.locator('#task-list .task-name')).toHaveText('Подготовить итоговый отчёт');
  await expect(page.locator('#task-list .badge')).toHaveText('средний');
  await expect(page.locator('#confirmation')).toContainText('изменена');
});

test('отмена редактирования возвращает форму в режим создания', async ({ page }) => {
  await createTask(page, 'Задача', 'низкий');
  await page.click('button[data-action="edit"]');
  await page.click('#task-cancel');
  await expect(page.locator('#task-submit')).toHaveText('Сохранить');
  await expect(page.locator('#task-id')).toHaveValue('');
});

test('отметка задачи как выполненной и возврат в работу', async ({ page }) => {
  await createTask(page, 'Задача', 'высокий');
  await page.click('button[data-action="done"]');
  await expect(page.locator('.task-item--done')).toHaveCount(1);
  await page.click('button[data-action="done"]');
  await expect(page.locator('.task-item--done')).toHaveCount(0);
});

test('удаление задачи', async ({ page }) => {
  await createTask(page, 'Задача', 'высокий');
  await page.click('button[data-action="remove"]');
  await expect(page.locator('#task-list .task-name')).toHaveCount(0);
  await expect(page.locator('#empty-message')).toBeVisible();
  await expect(page.locator('#confirmation')).toContainText('удалена');
});

test('удаление несуществующей задачи', async ({ page }) => {
  await createTask(page, 'Задача', 'высокий');
  await page.evaluate(() => {
    const btn = document.querySelector('button[data-action="remove"]');
    btn.dataset.id = 'nonexistent-id';
  });
  await page.click('button[data-action="remove"]');
  await expect(page.locator('#confirmation')).toContainText('Задача не найдена');
  await expect(page.locator('#task-list .task-name')).toHaveCount(1);
});

test('изоляция задач по пользователю', async ({ page }) => {
  await page.fill('#user-name', 'Иван');
  await page.click('#user-form button[type="submit"]');
  await createTask(page, 'Отчёт', 'высокий');

  await page.fill('#user-name', 'Пётр');
  await page.click('#user-form button[type="submit"]');

  await expect(page.locator('#current-user-label')).toHaveText('Пётр');
  await expect(page.locator('#task-list .task-name')).toHaveCount(0);
  await expect(page.locator('#empty-message')).toBeVisible();
});

test('поиск задач по названию', async ({ page }) => {
  await createTask(page, 'Подготовить отчёт', 'высокий');
  await createTask(page, 'Оплатить счёт', 'средний');

  await page.fill('#task-search', 'отчёт');
  await expect(page.locator('#task-list .task-name')).toHaveText(['Подготовить отчёт']);

  await page.fill('#task-search', 'несуществующий текст');
  await expect(page.locator('#task-list .task-name')).toHaveCount(0);
  await expect(page.locator('#no-match-message')).toBeVisible();

  await page.fill('#task-search', '');
  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Подготовить отчёт',
    'Оплатить счёт',
  ]);
});

test('фильтр задач по статусу', async ({ page }) => {
  await createTask(page, 'Задача 1', 'высокий');
  await createTask(page, 'Задача 2', 'средний');
  await page.click('button[data-action="done"]');

  await page.selectOption('#task-filter', 'done');
  await expect(page.locator('#task-list .task-name')).toHaveText(['Задача 1']);

  await page.selectOption('#task-filter', 'active');
  await expect(page.locator('#task-list .task-name')).toHaveText(['Задача 2']);

  await page.selectOption('#task-filter', 'all');
  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Задача 1',
    'Задача 2',
  ]);
});

test('статистика по задачам', async ({ page }) => {
  await expect(page.locator('#task-stats')).toHaveText('Задач пока нет');

  await createTask(page, 'Задача 1', 'высокий');
  await createTask(page, 'Задача 2', 'средний');
  await expect(page.locator('#task-stats')).toHaveText('Всего: 2 • Выполнено: 0');

  await page.click('button[data-action="done"]');
  await expect(page.locator('#task-stats')).toHaveText('Всего: 2 • Выполнено: 1');
});

test('поиск и фильтр применяются совместно', async ({ page }) => {
  await createTask(page, 'Отчёт', 'высокий');
  await createTask(page, 'Отчёт', 'низкий');
  await createTask(page, 'Письмо', 'низкий');

  await page.selectOption('#task-filter', 'active');
  await page.fill('#task-search', 'отчёт');
  await expect(page.locator('#task-list .task-name')).toHaveText(['Отчёт', 'Отчёт']);
});

test('сортировка задач по приоритету', async ({ page }) => {
  await createTask(page, 'Задача низкого приоритета', 'низкий');
  await createTask(page, 'Задача высокого приоритета', 'высокий');
  await createTask(page, 'Задача среднего приоритета', 'средний');

  await page.selectOption('#task-sort', 'priority');
  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Задача высокого приоритета',
    'Задача среднего приоритета',
    'Задача низкого приоритета',
  ]);
});

test('сортировка задач по дате начала', async ({ page }) => {
  await createTask(page, 'Позже', 'низкий', '2023-09-30');
  await createTask(page, 'Раньше', 'низкий', '2023-08-01');
  await createTask(page, 'Без даты', 'низкий');

  await page.selectOption('#task-sort', 'start');
  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Раньше',
    'Позже',
    'Без даты',
  ]);
});

test('сортировка задач по дате создания (по умолчанию)', async ({ page }) => {
  await createTask(page, 'Первая', 'низкий');
  await createTask(page, 'Вторая', 'средний');
  await createTask(page, 'Третья', 'высокий');

  await page.selectOption('#task-sort', 'created');
  await expect(page.locator('#task-list .task-name')).toHaveText(['Первая', 'Вторая', 'Третья']);
});

test('экспорт задач в JSON-файл', async ({ page }) => {
  await createTask(page, 'Экспортируемая', 'высокий');

  const downloadPromise = page.waitForEvent('download');
  await page.click('#task-export');
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('taskadmin-Гость.json');
  const path = await download.path();
  const content = JSON.parse(require('fs').readFileSync(path, 'utf-8'));
  expect(content).toHaveLength(1);
  expect(content[0].title).toBe('Экспортируемая');
  expect(content[0].priority).toBe('высокий');
});

test('импорт задач из JSON-файла', async ({ page }) => {
  const data = JSON.stringify([
    { id: 'abc', title: 'Импортированная 1', priority: 'высокий', startDate: '2023-08-10', done: false },
    { id: 'def', title: 'Импортированная 2', priority: 'низкий', startDate: '', done: true },
  ]);

  await page.setInputFiles('#task-import', {
    name: 'tasks.json',
    mimeType: 'application/json',
    buffer: Buffer.from(data),
  });

  await expect(page.locator('#task-list .task-name')).toHaveText([
    'Импортированная 1',
    'Импортированная 2',
  ]);
  await expect(page.locator('#task-stats')).toHaveText('Всего: 2 • Выполнено: 1');
});

test('импорт некорректного JSON-файла показывает ошибку', async ({ page }) => {
  await page.setInputFiles('#task-import', {
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not-json{{{'),
  });

  await expect(page.locator('#confirmation')).toContainText('Некорректный файл импорта');
  await expect(page.locator('#empty-message')).toBeVisible();
});
