# Triển khai backend + MySQL lên server riêng

Backend Laravel và MySQL chạy bằng Docker Compose trên server Ubuntu. Nginx có sẵn trên server làm reverse proxy và lo HTTPS. Frontend vẫn để trên Vercel.

```
Trình duyệt ─► Vercel (React)
                 │ https://htask-api.haismile.dev/api
                 ▼
            Nginx trên server (HTTPS, certbot)
                 │ http://127.0.0.1:8081
                 ▼
            Docker Compose: backend (Laravel + Apache) ─► mysql (MySQL 8)
```

- MySQL không mở cổng ra ngoài, chỉ backend kết nối được.
- Backend chỉ nghe trên `127.0.0.1:8081`, mọi truy cập từ ngoài đều đi qua Nginx.
- Dữ liệu MySQL và ảnh tải lên nằm trong Docker volume, không mất khi cập nhật code.
- Khi khởi động, container tự chạy migrate và lịch gửi email nhắc hạn (8:00 hằng ngày).

Thay `htask-api.haismile.dev` bằng tên miền phụ bạn chọn ở mọi bước bên dưới.

## 1. Trỏ tên miền

Tạo bản ghi DNS cho `haismile.dev`:

| Loại | Tên | Giá trị |
|---|---|---|
| A | `htask-api` | IP công khai của server |

Nếu DNS quản lý trên Cloudflare, để chế độ **DNS only** (đám mây xám) trong lúc lấy chứng chỉ ở bước 4.

Kiểm tra: `dig +short htask-api.haismile.dev` phải trả về IP của server.

## 2. Lấy code và cấu hình

```bash
cd /opt
sudo git clone https://github.com/haismile9/Web_H-task.git htask
sudo chown -R $USER:$USER htask
cd htask/deploy

cp .env.example .env
echo "base64:$(openssl rand -base64 32)"   # dán kết quả vào APP_KEY
nano .env
```

Trong `.env` cần điền:
- `APP_KEY`: chuỗi vừa tạo. Giữ cố định, đổi đi sẽ làm mất hiệu lực dữ liệu đã mã hoá.
- `APP_URL`: `https://htask-api.haismile.dev`
- `FRONTEND_URL`: địa chỉ frontend trên Vercel, dùng cho link trong email mời.
- `DB_PASSWORD`: mật khẩu mạnh cho MySQL.
- `MAIL_*`: tài khoản gửi mail.
- `BACKEND_PORT`: đổi nếu cổng 8081 đã có dịch vụ khác dùng (`sudo ss -ltnp | grep 8081`).

## 3. Chạy backend và MySQL

```bash
docker compose up -d --build
docker compose logs -f backend      # chờ dòng "resuming normal operations", Ctrl+C để thoát
curl -I http://127.0.0.1:8081/up    # phải trả về HTTP/1.1 200
```

## 4. Cấu hình Nginx và HTTPS

```bash
sudo cp /opt/htask/deploy/nginx/htask-api.conf /etc/nginx/sites-available/htask-api.conf
sudo nano /etc/nginx/sites-available/htask-api.conf    # sửa server_name và cổng nếu khác
sudo ln -s /etc/nginx/sites-available/htask-api.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d htask-api.haismile.dev
```

Certbot tự thêm cấu hình HTTPS và tự gia hạn chứng chỉ. Các site khác trên Nginx (ví dụ `lumieyewear.vn`) không bị ảnh hưởng.

Kiểm tra: `curl https://htask-api.haismile.dev/up` trả về trang trạng thái với mã 200.

## 5. Nối frontend trên Vercel

Trong project Vercel → **Settings → Environment Variables**:

```
VITE_API_URL=https://htask-api.haismile.dev/api
```

Sau đó **Redeploy**, vì Vite gắn giá trị này vào lúc build.

## Cập nhật khi có code mới

```bash
cd /opt/htask
git pull
cd deploy
docker compose up -d --build backend
```

Migration mới tự chạy khi container khởi động lại.

## Vận hành

| Việc | Lệnh (chạy trong `/opt/htask/deploy`) |
|---|---|
| Xem log | `docker compose logs -f backend` |
| Chạy lệnh artisan | `docker compose exec -u www-data backend php artisan <lệnh>` |
| Gửi thử mail nhắc hạn | `docker compose exec -u www-data backend php artisan check:task-deadlines` |
| Sao lưu database | `docker compose exec mysql sh -c 'exec mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > backup-$(date +%F).sql` |
| Khôi phục database | `docker compose exec -T mysql sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < backup.sql` |
| Dừng | `docker compose down` (dữ liệu vẫn giữ trong volume) |

> Không chạy `docker compose down -v`: lệnh này xoá luôn volume, mất toàn bộ database và ảnh tải lên.
