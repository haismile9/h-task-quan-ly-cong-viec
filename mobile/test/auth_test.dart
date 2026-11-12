import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/auth/auth_api.dart';
import 'package:htask/features/auth/auth_widgets.dart';
import 'package:htask/models/project.dart';

void main() {
  test('kiểm tra email', () {
    expect(isValidEmail('a@b.co'), isTrue);
    expect(isValidEmail(' a.b@c.vn '), isTrue);
    expect(isValidEmail('ab.co'), isFalse);
    expect(isValidEmail('a@b'), isFalse);
    expect(isValidEmail('a b@c.vn'), isFalse);
  });

  test('đọc lời mời', () {
    final inv = InvitationInfo.fromJson({
      'email': 'x@y.z',
      'accepted': false,
      'has_account': true,
      'project': {'id': '17', 'name': 'Bảng', 'background_url': 'gradient:blue'},
      'inviter_name': null,
    });
    expect(inv.projectId, 17);
    expect(inv.hasAccount, isTrue);
    expect(inv.accepted, isFalse);
    expect(inv.inviterName, isNull);
  });

  test('thành viên bảng = chủ + người trong dự án (không trùng), kèm lời mời đang chờ', () {
    final p = Project.fromJson({
      'id': 1,
      'name': 'B',
      'owner_id': 5,
      'owner': {'id': 5, 'name': 'Hai', 'email': 'h@x.com'},
      'users': [
        {'id': 5, 'name': 'Hai', 'email': 'h@x.com'},
        {'id': 7, 'name': 'Lan', 'email': 'l@x.com'},
      ],
      'pending_invitations': [
        {'id': 3, 'email': 'moi@x.com', 'created_at': '2026-11-12'},
      ],
    });
    expect(p.allMembers.map((u) => u.id), [5, 7]);
    expect(p.pendingInvitations.single.email, 'moi@x.com');
  });
}
