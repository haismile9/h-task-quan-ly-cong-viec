import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/user.dart';

/// Trạng thái đăng nhập: loading (đang khôi phục phiên) → User? (null = chưa đăng nhập).
class AuthController extends AsyncNotifier<User?> {
  ApiClient get _api => ref.read(apiClientProvider);
  TokenStorage get _storage => ref.read(tokenStorageProvider);

  @override
  Future<User?> build() async {
    // API trả 401 ở bất kỳ đâu → đăng xuất về màn hình đăng nhập
    Future.microtask(() => ref.read(unauthorizedHandlerProvider.notifier).state = _expire);

    final token = await _storage.read();
    if (token == null) return null;
    _api.token = token;
    try {
      final json = await _api.get<Map<String, dynamic>>('/user');
      return User.fromJson(json);
    } on ApiException catch (e) {
      if (e.statusCode == 401) {
        await _clear();
        return null;
      }
      // Mất mạng lúc mở app: vẫn coi là đăng nhập (token còn), màn hình sau sẽ báo lỗi mạng
      rethrow;
    }
  }

  Future<void> login(String email, String password) async {
    final json = await _api.post<Map<String, dynamic>>('/login', {'email': email.trim(), 'password': password});
    final token = json['token'] as String;
    _api.token = token;
    await _storage.write(token);
    state = AsyncData(User.fromJson(json['user'] as Map<String, dynamic>));
  }

  Future<void> logout() async {
    try {
      await _api.post('/logout');
    } catch (_) {
      // Token hết hạn hoặc mất mạng: vẫn xoá phiên ở máy
    }
    await _clear();
    state = const AsyncData(null);
  }

  void _expire() {
    if (state.valueOrNull == null) return;
    _clear();
    state = const AsyncData(null);
  }

  Future<void> _clear() async {
    _api.token = null;
    await _storage.clear();
  }
}

final authProvider = AsyncNotifierProvider<AuthController, User?>(AuthController.new);
