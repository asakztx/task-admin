#!/bin/sh
# Управление darkhttpd для проекта «Управление задачами»
# Использование: ./serve.sh {start|stop|status|restart}

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${DARKHTTPD_PORT:-8080}"
ADDR="${DARKHTTPD_ADDR:-0.0.0.0}"
LOG="${DARKHTTPD_LOG:-/tmp/darkhttpd.log}"
PIDFILE="${DARKHTTPD_PIDFILE:-/tmp/darkhttpd.pid}"

start() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; then
    echo "darkhttpd уже запущен (pid $(cat "$PIDFILE"))."
    return 0
  fi
  nohup darkhttpd "$ROOT_DIR" --port "$PORT" --addr "$ADDR" >"$LOG" 2>&1 &
  echo $! > "$PIDFILE"
  sleep 1
  echo "darkhttpd запущен: http://$ADDR:$PORT/ (log: $LOG, pid: $(cat "$PIDFILE"))"
}

stop() {
  if [ ! -f "$PIDFILE" ]; then
    echo "Нет pid-файла, darkhttpd не запущен."
    return 0
  fi
  kill "$(cat "$PIDFILE")" 2>/dev/null
  rm -f "$PIDFILE"
  echo "darkhttpd остановлен."
}

status() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; then
    echo "darkhttpd работает (pid $(cat "$PIDFILE"))."
  else
    echo "darkhttpd не работает."
  fi
}

case "${1:-}" in
  start)   start ;;
  stop)    stop ;;
  restart) stop; start ;;
  status)  status ;;
  *)       echo "Использование: $0 {start|stop|status|restart}" ;;
esac
