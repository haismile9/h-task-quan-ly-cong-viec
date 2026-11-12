// Sinh từ frontend/src/utils/presetPhotos.ts — giữ cùng thứ tự và id để khớp bản web.
// Ảnh Unsplash (giấy phép Unsplash: dùng miễn phí).

class PresetPhoto {
  const PresetPhoto(this.id, this.label, this.tags);

  final String id;
  final String label;
  final String tags;

  String get url => _photoUrl(id, 1920);
  String get thumb => _photoUrl(id, 400);
}

String _photoUrl(String id, int w) => 'https://images.unsplash.com/photo-$id?auto=format&fit=crop&w=$w&q=80';

const presetPhotos = [
  PresetPhoto('1506905925346-21bda4d32df4', 'Núi trên mây', 'núi mây mountain cloud'),
  PresetPhoto('1501785888041-af3ef285b470', 'Hồ trên núi', 'hồ núi thuyền lake mountain'),
  PresetPhoto('1475924156734-496f6cac6ec1', 'Biển lúc hoàng hôn', 'biển hoàng hôn bãi beach sea sunset'),
  PresetPhoto('1464822759023-fed622ff2c3b', 'Dãy núi và hồ', 'núi hồ rừng mountain lake'),
  PresetPhoto('1519681393784-d120267933ba', 'Núi dưới bầu trời sao', 'núi đêm sao bầu trời mountain night star sky'),
  PresetPhoto('1507525428034-b723cf961d3e', 'Bãi biển', 'biển bãi cát bình minh beach sea'),
  PresetPhoto('1494500764479-0c8f2919a3d8', 'Hồ tím', 'hồ hoàng hôn tím cây lake sunset purple'),
  PresetPhoto('1470071459604-3b5ec3a7fe05', 'Đồi xanh', 'đồi núi hoàng hôn cỏ hill sunset'),
  PresetPhoto('1500530855697-b586d89ba3ee', 'Con đường hẻm núi', 'đường núi sa mạc road canyon desert'),
  PresetPhoto('1426604966848-d7adac402bff', 'Vách núi', 'núi rừng thung lũng mountain valley'),
  PresetPhoto('1469474968028-56623f02e42e', 'Thung lũng', 'thung lũng núi valley mountain'),
  PresetPhoto('1477346611705-65d1883cee1e', 'Núi đỏ', 'núi đỏ mountain red'),
  PresetPhoto('1472214103451-9374bd1c798e', 'Đồng cỏ', 'đồi cỏ hoàng hôn xanh hill grass'),
  PresetPhoto('1439066615861-d1af74d74000', 'Cầu gỗ trên hồ', 'hồ cầu gỗ lake pier'),
  PresetPhoto('1433086966358-54859d0ed716', 'Thác nước', 'thác nước rừng waterfall forest'),
  PresetPhoto('1418065460487-3e41a6c84dc5', 'Rừng sương', 'rừng sương mù forest fog'),
  PresetPhoto('1441974231531-c6227db76b6e', 'Rừng cây', 'rừng cây nắng forest tree'),
  PresetPhoto('1447752875215-b2761acb3c5d', 'Cây cầu trong rừng', 'rừng cầu forest bridge'),
  PresetPhoto('1502082553048-f009c37129b9', 'Cây cổ thụ', 'cây đồng cỏ tree'),
  PresetPhoto('1518173946687-a4c8892bbd9f', 'Lá xanh', 'lá cây xanh leaf green'),
  PresetPhoto('1465146344425-f00d5f5c8f07', 'Đồng hoa', 'hoa đồng cỏ flower field'),
  PresetPhoto('1490750967868-88aa4486c946', 'Hoa vàng', 'hoa vàng flower yellow'),
  PresetPhoto('1505144808419-1957a94ca61e', 'Sóng biển', 'biển sóng nước ocean wave sea'),
  PresetPhoto('1534447677768-be436bb09401', 'Đêm đầy sao', 'đêm sao biển bầu trời night star sky'),
  PresetPhoto('1419242902214-272b3f66ee7a', 'Bầu trời sao', 'đêm sao bầu trời night star sky'),
  PresetPhoto('1462331940025-496dfbfc7564', 'Thiên hà', 'vũ trụ thiên hà không gian space galaxy'),
  PresetPhoto('1449824913935-59a10b8d2000', 'Phố đông', 'thành phố đường phố city street'),
  PresetPhoto('1480714378408-67cf0d13bc1b', 'Toà nhà cao tầng', 'thành phố toà nhà city building'),
  PresetPhoto('1514565131-fce0801e5785', 'Thành phố về đêm', 'thành phố đêm city night'),
  PresetPhoto('1557682250-33bd709cbe85', 'Tím hồng', 'trừu tượng tím hồng abstract gradient'),
  PresetPhoto('1579546929518-9e396f3cc809', 'Cầu vồng', 'trừu tượng nhiều màu abstract gradient'),
];
