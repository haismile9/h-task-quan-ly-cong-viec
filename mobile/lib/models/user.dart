import 'json.dart';

/// Các email thông báo bật/tắt được trong Cài đặt (tên trường khớp với API).
enum EmailSetting {
  deadlineReminders('email_deadline_reminders'),
  projectAdded('email_project_added');

  const EmailSetting(this.key);
  final String key;
}

class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    this.role = 'member',
    this.emailDeadlineReminders = true,
    this.emailProjectAdded = true,
  });

  final int id;
  final String name;
  final String email;

  /// admin | leader | member
  final String role;

  /// Cài đặt: nhận email nhắc việc sắp đến hạn.
  final bool emailDeadlineReminders;

  /// Cài đặt: nhận email khi được thêm vào dự án.
  final bool emailProjectAdded;

  bool get isAdmin => role == 'admin';

  bool emailSetting(EmailSetting s) => switch (s) {
        EmailSetting.deadlineReminders => emailDeadlineReminders,
        EmailSetting.projectAdded => emailProjectAdded,
      };

  User copyWith({String? name, bool? emailDeadlineReminders, bool? emailProjectAdded}) => User(
        id: id,
        name: name ?? this.name,
        email: email,
        role: role,
        emailDeadlineReminders: emailDeadlineReminders ?? this.emailDeadlineReminders,
        emailProjectAdded: emailProjectAdded ?? this.emailProjectAdded,
      );

  User withEmailSetting(EmailSetting s, bool enabled) => switch (s) {
        EmailSetting.deadlineReminders => copyWith(emailDeadlineReminders: enabled),
        EmailSetting.projectAdded => copyWith(emailProjectAdded: enabled),
      };

  /// Thiếu trường (tài khoản cũ) → coi như bật, giống mặc định ở server.
  static bool _flag(Object? v) => v != false && v != 0 && v != '0';

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: asInt(json['id']),
        name: (json['name'] ?? '') as String,
        email: (json['email'] ?? '') as String,
        role: (json['role'] ?? 'member') as String,
        emailDeadlineReminders: _flag(json[EmailSetting.deadlineReminders.key]),
        emailProjectAdded: _flag(json[EmailSetting.projectAdded.key]),
      );
}
