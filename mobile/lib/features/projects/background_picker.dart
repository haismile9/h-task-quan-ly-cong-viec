import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/backgrounds.dart';
import '../../core/preset_photos.dart';

/// Lưới chọn phông nền: 12 màu gradient + 31 ảnh có sẵn (cùng bộ với bản web).
class BackgroundPicker extends StatelessWidget {
  const BackgroundPicker({super.key, required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget title(String text) => Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 8),
          child: Text(text, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        title('Màu sắc'),
        _Grid(children: [
          for (final id in boardGradients.keys)
            _Swatch(
              selected: value == 'gradient:$id',
              onTap: () => onChanged('gradient:$id'),
              child: DecoratedBox(decoration: BoxDecoration(gradient: gradientFor('gradient:$id'))),
            ),
        ]),
        title('Ảnh'),
        _Grid(children: [
          for (final p in presetPhotos)
            _Swatch(
              selected: value == p.url,
              tooltip: p.label,
              onTap: () => onChanged(p.url),
              child: CachedNetworkImage(
                imageUrl: p.thumb,
                fit: BoxFit.cover,
                placeholder: (_, __) => ColoredBox(color: theme.colorScheme.surfaceContainerHighest),
              ),
            ),
        ]),
      ],
    );
  }
}

class _Grid extends StatelessWidget {
  const _Grid({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1.6,
        children: children,
      );
}

class _Swatch extends StatelessWidget {
  const _Swatch({required this.selected, required this.onTap, required this.child, this.tooltip});

  final bool selected;
  final VoidCallback onTap;
  final Widget child;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final tile = GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: selected ? Border.all(color: Theme.of(context).colorScheme.primary, width: 3) : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(selected ? 5 : 8),
          child: Stack(fit: StackFit.expand, children: [
            child,
            if (selected)
              const Center(child: Icon(Icons.check, color: Colors.white, shadows: [Shadow(blurRadius: 4)])),
          ]),
        ),
      ),
    );
    return Semantics(
      selected: selected,
      button: true,
      label: tooltip,
      child: tooltip == null ? tile : Tooltip(message: tooltip!, child: tile),
    );
  }
}
