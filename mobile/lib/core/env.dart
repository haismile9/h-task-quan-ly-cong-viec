import 'package:flutter/foundation.dart';

/// Cấu hình theo môi trường. Đổi máy chủ khi chạy:
///   flutter run --dart-define=API_URL=http://192.168.1.10:8000/api
class Env {
  static const _apiUrl = String.fromEnvironment('API_URL');

  /// Mặc định:
  ///  - bản debug: backend chạy ở máy (`php artisan serve`); 10.0.2.2 là máy tính khi chạy trên máy ảo Android.
  ///  - bản release: máy chủ thật (đổi khi đã có tên miền API).
  static String get apiUrl {
    if (_apiUrl.isNotEmpty) return _apiUrl;
    return kDebugMode ? 'http://10.0.2.2:8000/api' : 'https://htask-api.haismile.dev/api';
  }
}
