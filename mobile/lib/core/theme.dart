import 'package:flutter/material.dart';

const brandBlue = Color(0xFF0C66E4);

ThemeData buildTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: brandBlue,
    brightness: brightness,
    primary: dark ? const Color(0xFF579DFF) : brandBlue,
    surface: dark ? const Color(0xFF1D2125) : Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? const Color(0xFF161A1D) : const Color(0xFFF7F8F9),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      foregroundColor: scheme.onSurface,
      elevation: 0,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF22272B) : const Color(0xFFF1F2F4),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        // Không dùng Size.fromHeight (rộng vô hạn) — nút trong Row / hộp thoại sẽ lỗi bố cục.
        // Nút cần rộng hết cỡ đặt trong Column stretch hoặc ListView.
        minimumSize: const Size(64, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: dark ? const Color(0xFF1D2125) : Colors.white,
      indicatorColor: scheme.primary.withOpacity(0.15),
      labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
    ),
  );
}
