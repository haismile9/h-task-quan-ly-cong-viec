import 'package:flutter/material.dart';

/// Cùng bảng màu và cách băm FNV-1a với frontend/src/components/ui/Avatar.tsx,
/// để một người có cùng màu avatar trên web và mobile.
const _palette = [
  Color(0xFF0C66E4),
  Color(0xFF1F845A),
  Color(0xFFC9372C),
  Color(0xFF6E5DC6),
  Color(0xFFB65C02),
  Color(0xFF227D9B),
  Color(0xFFAE4787),
  Color(0xFF5B7F24),
  Color(0xFF4F46E5),
  Color(0xFF8F5B3A),
  Color(0xFFD6336C),
  Color(0xFF44546F),
];

Color avatarColor(String name) {
  var hash = 0x811c9dc5;
  for (final rune in name.trim().toLowerCase().runes) {
    hash ^= rune;
    hash = (hash * 0x01000193) & 0xffffffff;
  }
  return _palette[hash % _palette.length];
}

String initials(String name) {
  final words = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
  if (words.isEmpty) return '?';
  return words.skip(words.length > 2 ? words.length - 2 : 0).map((w) => w.characters.first).join().toUpperCase();
}

class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.name, this.size = 32});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: avatarColor(name), shape: BoxShape.circle),
        child: Text(
          initials(name),
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: size * 0.38),
        ),
      );
}
