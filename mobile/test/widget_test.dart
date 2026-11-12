import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:htask/widgets/avatar.dart';

void main() {
  test('avatar: chữ cái đầu lấy 2 từ cuối', () {
    expect(initials('Hồng Hải Nguyễn'), 'HN');
    expect(initials('Hai'), 'H');
    expect(initials('   '), '?');
  });

  test('avatar: màu cố định theo tên, không phân biệt hoa thường', () {
    expect(avatarColor('Hai'), avatarColor(' hai '));
    // Cùng chỉ số với bản web (FNV-1a): "Hai" → 1 (xanh lá), "Thương" → 5 (xanh ngọc)
    expect(avatarColor('Hai'), const Color(0xFF1F845A));
    expect(avatarColor('Thương'), const Color(0xFF227D9B));
  });
}
