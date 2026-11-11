# Backend Laravel cho Render (Docker). Cấu hình (APP_KEY, DB_*, MAIL_*, FRONTEND_URL...)
# đặt trong Environment của Render, không đóng gói file .env vào image.

# ---- Cài thư viện PHP ----
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --ignore-platform-reqs
COPY . .
RUN composer dump-autoload --optimize --no-dev --no-scripts

# ---- Image chạy thật ----
FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libzip-dev libpq-dev unzip \
    && docker-php-ext-install pdo_mysql pdo_pgsql zip bcmath \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Ảnh nền tải lên tối đa 5MB (mặc định của PHP chỉ 2MB)
RUN printf 'upload_max_filesize=6M\npost_max_size=8M\nmemory_limit=256M\nexpose_php=Off\n' > /usr/local/etc/php/conf.d/app.ini

# Apache phục vụ thư mục public/ và nghe cổng $PORT do Render cấp
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf \
    && sed -ri 's!^Listen 80$!Listen ${PORT}!' /etc/apache2/ports.conf \
    && sed -ri 's!<VirtualHost \*:80>!<VirtualHost *:${PORT}>!' /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
COPY --from=vendor /app /var/www/html
RUN php artisan package:discover --ansi \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENV PORT=10000 \
    APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

EXPOSE 10000
CMD ["entrypoint"]
