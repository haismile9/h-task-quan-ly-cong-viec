import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

/// Gradient khớp với frontend/src/utils/boardBackgrounds.ts (cùng id, cùng màu).
const Map<String, List<Color>> boardGradients = {
  'blue': [Color(0xFF0C66E4), Color(0xFF1D7AFC), Color(0xFF579DFF)],
  'navy': [Color(0xFF09326C), Color(0xFF0055CC), Color(0xFF1D7AFC)],
  'teal': [Color(0xFF0C66E4), Color(0xFF1F9BB4), Color(0xFF4BCE97)],
  'purple': [Color(0xFF6E5DC6), Color(0xFF9F8FEF)],
  'pink': [Color(0xFF7F5FD8), Color(0xFFE774BB)],
  'dusk': [Color(0xFF1C2B41), Color(0xFF943D73)],
  'sunset': [Color(0xFFE2483D), Color(0xFFFAA53D)],
  'red': [Color(0xFFAE2E24), Color(0xFFF87168)],
  'green': [Color(0xFF216E4E), Color(0xFF4BCE97)],
  'lime': [Color(0xFF4C6B1F), Color(0xFF94C748)],
  'slate': [Color(0xFF1D2125), Color(0xFF44546F)],
  'light': [Color(0xFFCCE0FF), Color(0xFFE9F2FF)],
};

bool isImageBackground(String? value) => value != null && RegExp(r'^https?://').hasMatch(value);

/// Ảnh Unsplash nhỏ hơn cho ô thu nhỏ.
String thumbUrl(String url) =>
    url.contains('images.unsplash.com') ? url.replaceAll(RegExp(r'([?&])w=\d+'), r'$1w=400') : url;

LinearGradient gradientFor(String? value) {
  List<Color>? colors;
  if (value != null && value.startsWith('gradient:')) {
    colors = boardGradients[value.substring('gradient:'.length)];
  } else if (value != null && !isImageBackground(value)) {
    // Ảnh minh hoạ cũ: chọn cố định trong 6 gradient đầu như bản web
    var h = 0;
    for (final c in value.codeUnits) {
      h = (h * 31 + c) & 0x7fffffff;
    }
    colors = boardGradients.values.elementAt(h % 6);
  }
  return LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: colors ?? boardGradients['blue']!,
  );
}

/// Nền của bảng (ảnh phủ kín hoặc gradient) đặt phía sau [child].
class BoardBackground extends StatelessWidget {
  const BoardBackground({super.key, required this.value, this.thumb = false, this.child});

  final String? value;
  final bool thumb;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final v = value;
    if (isImageBackground(v)) {
      return Stack(fit: StackFit.expand, children: [
        CachedNetworkImage(
          imageUrl: thumb ? thumbUrl(v!) : v!,
          fit: BoxFit.cover,
          placeholder: (_, __) => const ColoredBox(color: Color(0xFF1D2125)),
          errorWidget: (_, __, ___) => DecoratedBox(decoration: BoxDecoration(gradient: gradientFor(null))),
        ),
        if (child != null) child!,
      ]);
    }
    return DecoratedBox(decoration: BoxDecoration(gradient: gradientFor(v)), child: child);
  }
}
