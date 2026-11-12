/// Đọc số từ JSON của Laravel: có lúc là số, có lúc là chuỗi
/// (vd. `list_id` trả về đúng giá trị đã gửi lên khi tạo thẻ).
int asInt(Object? value, [int fallback = 0]) => switch (value) {
      int v => v,
      num v => v.toInt(),
      String v => int.tryParse(v) ?? fallback,
      _ => fallback,
    };

int? asIntOrNull(Object? value) => switch (value) {
      int v => v,
      num v => v.toInt(),
      String v => int.tryParse(v),
      _ => null,
    };
