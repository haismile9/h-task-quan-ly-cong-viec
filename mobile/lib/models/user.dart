import 'json.dart';

class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'member',
    this.emailDeadlineReminders = true,
  });

  final int id;
  final String name;
  final String email;

  /// admin | leader | member
  final String role;

  /// Cài đặt: nhận email nhắc việc sắp đến hạn.
  final bool emailDeadlineReminders;

  bool get isAdmin => role == 'admin';

  User copyWith({String? name, bool? emailDeadlineReminders}) => User(
        id: id,
        name: name ?? this.name,
        email: email,
        role: role,
        emailDeadlineReminders: emailDeadlineReminders ?? this.emailDeadlineReminders,
      );

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: asInt(json['id']),
        name: (json['name'] ?? '') as String,
        email: (json['email'] ?? '') as String,
        role: (json['role'] ?? 'member') as String,
        emailDeadlineReminders: json['email_deadline_reminders'] != false && json['email_deadline_reminders'] != 0,
      );
}
