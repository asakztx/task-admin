# AGENTS.md

## Language

- Всегда работаем на русском языке.
- Все выводы, сообщения и сохраняемые файлы/комментарии выполняются на русском языке.

## Environment

- **Operating system:** Alpine Linux (v3.24.1), Linux kernel 6.12.76-linuxkit, x86_64
- **Default user:** root
- **Package manager:** `apk` (Alpine Package Keeper)

## Git

- Используем **Conventional Commits** (https://www.conventionalcommits.org): сообщения коммитов вида `тип: описание`, например `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.

## Локальный веб-сервер (darkhttpd)

Проект обслуживается лёгким веб-сервером **darkhttpd** (устанавливается через `apk add darkhttpd`). Контейнер «голый» (без systemd/OpenRC), поэтому сервер запускается через скрипт-обёртку `serve.sh`.

```sh
./serve.sh start     # запуск на http://0.0.0.0:8080/
./serve.sh stop      # остановка
./serve.sh status    # проверка состояния
./serve.sh restart   # перезапуск
```

- Корень сервера — директория проекта (`index.html`).
- Порт по умолчанию **8080** на адресе `0.0.0.0` (переопределяется переменными `DARKHTTPD_PORT`/`DARKHTTPD_ADDR`).
- Лог: `/tmp/darkhttpd.log`, PID: `/tmp/darkhttpd.pid`.
- Доступ с Windows-хоста — по проброшенному в контейнер порту, например `http://localhost:8080`.
- Bootstrap подключается с CDN, поэтому клиенту нужен доступ в интернет для полной вёрстки.

## E2E-тесты (Playwright)

Функциональность покрыта e2e-тестами на базе **Playwright** (Chromium, headless). Тесты обращаются к работающему darkhttpd на `http://localhost:8080`.

```sh
./serve.sh start   # запустить darkhttpd (если не запущен)
npm test           # выполнить e2e-тесты
```

- Конфигурация — `playwright.config.js` (`baseURL: http://localhost:8080`, `testDir: ./e2e`).
- Сценарии — `e2e/tasks.spec.js`.
- Каждый тест очищает `localStorage` перед запуском (изоляция состояния).
- Зависимости — `package.json` (`@playwright/test`); `node_modules` и артефакты тестов исключены через `.gitignore`.

## CI (GitHub Actions)

- Workflow — `.github/workflows/e2e.yml`, job `e2e` на `ubuntu-latest`.
- Запускается на push в `main` и на pull request.
- Шаги: checkout → setup-node (cache npm) → `npm ci` → `npx playwright install --with-deps chromium` → установка/запуск `darkhttpd` (`./serve.sh start`) → `npm test`.
- Node 20, браузер Chromium.
