import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/json.dart';

/// Các luồng chưa đăng nhập: đăng ký, quên mật khẩu, nhận lời mời (khớp frontend/src/api/auth.ts, invitations.ts).
class AuthApi {
  AuthApi(this._api);

  final ApiClient _api;

  // ----- Đăng ký từng bước (POST /register/start → /verify-code → /complete) -----

  Future<void> signupStart(String email) => _api.post('/register/start', {'email': email});

  Future<void> signupVerifyCode(String email, String code) =>
      _api.post('/register/verify-code', {'email': email, 'code': code});

  /// Tạo tài khoản + bảng mẫu; trả JSON có token, user, project_id.
  Future<Map<String, dynamic>> signupComplete({
    required String email,
    required String code,
    required String name,
    required String password,
  }) =>
      _api.post<Map<String, dynamic>>('/register/complete', {
        'email': email,
        'code': code,
        'name': name,
        'password': password,
        'password_confirmation': password,
      });

  Future<void> sendResetCode(String email) => _api.post('/password/reset/send-code', {'email': email});

  Future<void> verifyResetCode(String email, String code) =>
      _api.post('/password/reset/verify-code', {'email': email, 'code': code});

  Future<void> resetPassword({required String email, required String code, required String password}) =>
      _api.post('/password/reset', {
        'email': email,
        'code': code,
        'password': password,
        'password_confirmation': password,
      });

  // ----- Lời mời vào dự án -----

  Future<InvitationInfo> invitation(String token) async =>
      InvitationInfo.fromJson(await _api.get<Map<String, dynamic>>('/invitations/$token'));

  Future<void> sendInvitationCode(String token) => _api.post('/invitations/$token/send-code');

  Future<void> verifyInvitationCode(String token, String code) =>
      _api.post('/invitations/$token/verify-code', {'code': code});

  /// Tạo tài khoản từ lời mời; trả về JSON có token, user, project_id.
  Future<Map<String, dynamic>> acceptInvitation(String token, {required String code, required String name, required String password}) =>
      _api.post<Map<String, dynamic>>('/invitations/$token/accept', {
        'code': code,
        'name': name,
        'password': password,
        'password_confirmation': password,
      });
}

final authApiProvider = Provider((ref) => AuthApi(ref.watch(apiClientProvider)));

/// GET /invitations/{token} (công khai).
class InvitationInfo {
  const InvitationInfo({
    required this.email,
    required this.accepted,
    required this.hasAccount,
    required this.projectId,
    required this.projectName,
    this.projectBackground,
    this.inviterName,
  });

  final String email;
  final bool accepted;
  final bool hasAccount;
  final int projectId;
  final String projectName;
  final String? projectBackground;
  final String? inviterName;

  factory InvitationInfo.fromJson(Map<String, dynamic> json) {
    final p = (json['project'] as Map?) ?? const {};
    return InvitationInfo(
      email: (json['email'] ?? '') as String,
      accepted: json['accepted'] == true,
      hasAccount: json['has_account'] == true,
      projectId: asInt(p['id']),
      projectName: (p['name'] ?? '') as String,
      projectBackground: p['background_url'] as String?,
      inviterName: json['inviter_name'] as String?,
    );
  }
}
