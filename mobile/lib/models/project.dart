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
  final DateTime? updatedAt;

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
        updatedAt: DateTime.tryParse('${json['updated_at']}'),
      );
}
