import 'json.dart';

class User {
  const User({required this.id, required this.name, required this.email, this.role = 'member'});

  final int id;
  final String name;
  final String email;

  /// admin | leader | member
  final String role;

  bool get isAdmin => role == 'admin';

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: asInt(json['id']),
        name: (json['name'] ?? '') as String,
        email: (json['email'] ?? '') as String,
        role: (json['role'] ?? 'member') as String,
      );
}
