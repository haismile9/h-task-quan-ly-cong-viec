import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'env.dart';

/// Lỗi API đã chuyển sang câu tiếng Việt hiển thị được cho người dùng.
class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.fieldErrors = const {}});

  final String message;
  final int? statusCode;

  /// Lỗi theo từng trường của Laravel (422): {"email": ["..."]}.
  final Map<String, List<String>> fieldErrors;

  String? fieldError(String field) => fieldErrors[field]?.first;

  @override
  String toString() => message;

  factory ApiException.from(Object error) {
    if (error is ApiException) return error;
    if (error is DioException) {
      final res = error.response;
      if (res == null) {
        return ApiException('Không kết nối được máy chủ. Kiểm tra mạng và thử lại.');
      }
      final data = res.data;
      var message = 'Có lỗi xảy ra (mã ${res.statusCode}).';
      final fields = <String, List<String>>{};
      if (data is Map) {
        if (data['message'] is String) message = data['message'] as String;
        final errors = data['errors'];
        if (errors is Map) {
          errors.forEach((k, v) {
            if (v is List) fields['$k'] = v.map((e) => '$e').toList();
          });
          // "Dữ liệu không hợp lệ" chung chung → hiện lỗi đầu tiên cụ thể hơn
          if (fields.isNotEmpty) message = fields.values.first.first;
        }
      }
      if (res.statusCode == 401) message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      return ApiException(message, statusCode: res.statusCode, fieldErrors: fields);
    }
    return ApiException('Có lỗi không mong muốn: $error');
  }
}

/// Lưu token Sanctum an toàn (Keychain / Keystore).
class TokenStorage {
  static const _key = 'auth_token';
  final _storage = const FlutterSecureStorage();

  Future<String?> read() => _storage.read(key: _key);
  Future<void> write(String token) => _storage.write(key: _key, value: token);
  Future<void> clear() => _storage.delete(key: _key);
}

final tokenStorageProvider = Provider((_) => TokenStorage());

/// Gọi REST API Laravel: tự gắn Bearer token, báo ra ngoài khi gặp 401.
class ApiClient {
  ApiClient({required this.onUnauthorized})
      : dio = Dio(BaseOptions(
          baseUrl: Env.apiUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Accept': 'application/json'},
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401 && token != null) onUnauthorized();
        handler.next(error);
      },
    ));
  }

  final Dio dio;
  final void Function() onUnauthorized;

  /// Token hiện tại (giữ trong bộ nhớ; bản lưu lâu dài nằm ở TokenStorage).
  String? token;

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) =>
      _wrap(() => dio.get<T>(path, queryParameters: query));
  Future<T> post<T>(String path, [Object? body]) => _wrap(() => dio.post<T>(path, data: body));
  Future<T> put<T>(String path, [Object? body]) => _wrap(() => dio.put<T>(path, data: body));
  Future<T> delete<T>(String path) => _wrap(() => dio.delete<T>(path));

  Future<T> _wrap<T>(Future<Response<T>> Function() call) async {
    try {
      return (await call()).data as T;
    } catch (e) {
      throw ApiException.from(e);
    }
  }
}

/// Hàm gọi khi API trả 401 (gán bởi AuthController để đăng xuất).
final unauthorizedHandlerProvider = StateProvider<void Function()>((_) => () {});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(onUnauthorized: () => ref.read(unauthorizedHandlerProvider)());
});
