import 'package:crop_conduit_flutter/theme/app_theme.dart';
import 'package:flutter/material.dart';

class BrandHeader extends StatelessWidget {
  const BrandHeader({
    super.key,
    this.subtitle,
    this.center = false,
    this.logoHeight = 70,
  });

  final String? subtitle;
  final bool center;
  final double logoHeight;

  @override
  Widget build(BuildContext context) {
    final align = center ? CrossAxisAlignment.center : CrossAxisAlignment.start;
    return Column(
      crossAxisAlignment: align,
      children: [
        Image.asset(
          'assets/brand/agrismart-full.png',
          height: logoHeight,
          fit: BoxFit.contain,
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 10),
          Text(
            subtitle!,
            textAlign: center ? TextAlign.center : TextAlign.start,
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppTheme.textMuted),
          ),
        ],
      ],
    );
  }
}
