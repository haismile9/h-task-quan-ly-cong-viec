import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Giao diện Sáng / Tối / Theo hệ thống — lưu trên máy.
class ThemeModeController extends Notifier<ThemeMode> {
  static const _key = 'theme_mode';

  @override
  ThemeMode build() {
    SharedPreferences.getInstance().then((prefs) {
      final saved = ThemeMode.values.asNameMap()[prefs.getString(_key)];
      if (saved != null) state = saved;
    });
    return ThemeMode.system;
  }

  Future<void> set(ThemeMode mode) async {
    state = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, mode.name);
  }
}

final themeModeProvider = NotifierProvider<ThemeModeController, ThemeMode>(ThemeModeController.new);
