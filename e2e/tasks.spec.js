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
