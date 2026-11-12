import 'json.dart';
import 'user.dart';

class Project {
  const Project({
    required this.id,
    required this.name,
    required this.ownerId,
    this.description,
    this.backgroundUrl,
    this.owner,
    this.members = const [],
    this.pendingInvitations = const [],
    this.updatedAt,
  });

  final int id;
  final String name;
  final String? description;

  /// "gradient:<id>", URL ảnh, hoặc giá trị cũ — xem core/backgrounds.dart.
  final String? backgroundUrl;
  final int ownerId;
  final User? owner;
  final List<User> members;

  /// Lời mời gửi tới email chưa có tài khoản (chỉ có khi xem chi tiết dự án).
  final List<PendingInvitation> pendingInvitations;
  final DateTime? updatedAt;

  /// Thành viên bảng = chủ dự án + người trong project_user (dữ liệu cũ có thể thiếu chủ).
  List<User> get allMembers => [
        if (owner != null) owner!,
        ...members.where((m) => m.id != owner?.id),
      ];

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: asInt(json['id']),
        name: (json['name'] ?? '') as String,
        description: json['description'] as String?,
        backgroundUrl: json['background_url'] as String?,
        ownerId: asInt(json['owner_id']),
        owner: json['owner'] is Map<String, dynamic> ? User.fromJson(json['owner'] as Map<String, dynamic>) : null,
        members: (json['users'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(User.fromJson)
            .toList(),
        pendingInvitations: (json['pending_invitations'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(PendingInvitation.fromJson)
            .toList(),
        updatedAt: DateTime.tryParse('${json['updated_at']}'),
      );
}

class PendingInvitation {
  const PendingInvitation({required this.id, required this.email});

  final int id;
  final String email;

  factory PendingInvitation.fromJson(Map<String, dynamic> json) =>
      PendingInvitation(id: asInt(json['id']), email: (json['email'] ?? '') as String);
}
