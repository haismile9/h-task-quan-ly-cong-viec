#!/bin/sh
# Khởi động container: chuẩn bị storage, cache cấu hình, migrate, chạy lịch nhắc deadline rồi bật Apache.
set -e
cd /var/www/html

if [ -z "$APP_KEY" ]; then
  echo "Thiếu APP_KEY: tạo bằng 'php artisan key:generate --show' rồi thêm vào Environment của Render." >&2
  exit 1
fi

mkdir -p storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

as_www() { su -s /bin/sh www-data -c "$*"; }

# public/ thuộc root nên tạo symlink bằng root; bỏ qua nếu đã có
[ -e public/storage ] || php artisan storage:link
as_www "php artisan config:cache"
as_www "php artisan route:cache"
as_www "php artisan view:cache"

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  as_www "php artisan migrate --force"
fi

# Gửi mail nhắc deadline theo lịch (routes/console.php)
if [ "${RUN_SCHEDULER:-true}" = "true" ]; then
  su -s /bin/sh www-data -c "php artisan schedule:work" &
fi

exec apache2-foreground
