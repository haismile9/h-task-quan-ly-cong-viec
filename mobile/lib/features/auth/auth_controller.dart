import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

  /// [remember] = "Ghi nhớ đăng nhập": bật → lưu token (mở lại app vẫn vào thẳng) và nhớ email để tự điền;
  /// tắt → token chỉ giữ trong bộ nhớ, tắt hẳn app là phải đăng nhập lại (hợp với máy dùng chung).
  Future<void> login(String email, String password, {bool remember = true}) async {
    final json = await _api.post<Map<String, dynamic>>('/login', {'email': email.trim(), 'password': password});
    await LoginPrefs.save(email: remember ? email.trim() : null, remember: remember);
    await signInWith(json, persist: remember);
  }

  /// Lưu phiên từ một phản hồi có {token, user} (đăng nhập, xác minh email, nhận lời mời).
  Future<void> signInWith(Map<String, dynamic> json, {bool persist = true}) async {
    final token = json['token'] as String;
    _api.token = token;
    if (persist) {
      await _storage.write(token);
    } else {
      await _storage.clear();
    }
    state = AsyncData(User.fromJson(json['user'] as Map<String, dynamic>));
  }

  // ----- Tài khoản -----

  Future<void> updateName(String name) async {
    final json = await _api.put<Map<String, dynamic>>('/account', {'name': name});
    state = AsyncData(User.fromJson(json['user'] as Map<String, dynamic>));
  }

  /// Bật/tắt email nhắc hạn (lạc quan).
  Future<void> setDeadlineReminders(bool enabled) async {
    final previous = state.valueOrNull;
    if (previous != null) state = AsyncData(previous.copyWith(emailDeadlineReminders: enabled));
    try {
      await _api.put('/account/settings', {'email_deadline_reminders': enabled});
    } catch (e) {
      if (previous != null) state = AsyncData(previous);
      rethrow;
    }
  }

  /// Trả về thông báo của server (vd. "Đổi mật khẩu thành công").
  Future<String> changePassword(String current, String next) async {
    final json = await _api.put<Map<String, dynamic>>('/account/password', {
      'current_password': current,
      'password': next,
      'password_confirmation': next,
    });
    return (json['message'] as String?) ?? 'Đã đổi mật khẩu';
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

/// Lựa chọn "Ghi nhớ đăng nhập" và email đã nhớ (không phải bí mật → SharedPreferences).
/// Mật khẩu KHÔNG bao giờ lưu trong app — để trình quản lý mật khẩu của hệ điều hành lo (autofill).
class LoginPrefs {
  static const _rememberKey = 'login_remember';
  static const _emailKey = 'login_email';

  static Future<({bool remember, String email})> load() async {
    final prefs = await SharedPreferences.getInstance();
    return (remember: prefs.getBool(_rememberKey) ?? true, email: prefs.getString(_emailKey) ?? '');
  }

  static Future<void> save({required String? email, required bool remember}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_rememberKey, remember);
    if (email == null || email.isEmpty) {
      await prefs.remove(_emailKey);
    } else {
      await prefs.setString(_emailKey, email);
    }
  }
}
