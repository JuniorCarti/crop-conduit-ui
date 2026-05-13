import 'package:flutter/material.dart';

class AuthBackdrop extends StatelessWidget {
  const AuthBackdrop({
    super.key,
    required this.primaryColor,
    this.secondaryColor = const Color(0xFFF97316),
    this.tertiaryColor = const Color(0xFF38BDF8),
  });

  final Color primaryColor;
  final Color secondaryColor;
  final Color tertiaryColor;

  @override
  Widget build(BuildContext context) {
    final topTone = Color.lerp(
      const Color(0xFFF8FAF4),
      primaryColor.withValues(alpha: 0.08),
      0.5,
    )!;

    final bottomTone = Color.lerp(
      const Color(0xFFF8FAF4),
      secondaryColor.withValues(alpha: 0.08),
      0.35,
    )!;

    return SizedBox.expand(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [topTone, Colors.white, bottomTone],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: -100,
              left: -80,
              child: _Glow(
                size: 240,
                color: primaryColor.withValues(alpha: 0.20),
              ),
            ),
            Positioned(
              top: 120,
              right: -100,
              child: _Glow(
                size: 280,
                color: secondaryColor.withValues(alpha: 0.16),
              ),
            ),
            Positioned(
              bottom: -130,
              left: 36,
              child: _Glow(
                size: 300,
                color: tertiaryColor.withValues(alpha: 0.12),
              ),
            ),
            Positioned.fill(
              child: IgnorePointer(
                child: Opacity(
                  opacity: 0.09,
                  child: CustomPaint(
                    painter: _AuthGridPainter(
                      color: Color.lerp(primaryColor, Colors.white, 0.72)!,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthSurfaceCard extends StatelessWidget {
  const AuthSurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 28,
    this.backgroundColor,
    this.gradient,
    this.borderColor,
    this.shadowColor,
    this.onTap,
  });

  final Widget child;
  final EdgeInsets padding;
  final double borderRadius;
  final Color? backgroundColor;
  final Gradient? gradient;
  final Color? borderColor;
  final Color? shadowColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final decoration = BoxDecoration(
      color: backgroundColor ?? Colors.white.withValues(alpha: 0.88),
      gradient: gradient,
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: borderColor ?? Colors.white.withValues(alpha: 0.7),
      ),
      boxShadow: [
        BoxShadow(
          color: shadowColor ?? const Color(0x16000000),
          blurRadius: 30,
          offset: const Offset(0, 18),
        ),
      ],
    );

    final content = Ink(
      decoration: decoration,
      child: Padding(padding: padding, child: child),
    );

    return Material(
      color: Colors.transparent,
      child: onTap == null
          ? content
          : InkWell(
              borderRadius: BorderRadius.circular(borderRadius),
              onTap: onTap,
              child: content,
            ),
    );
  }
}

class AuthPill extends StatelessWidget {
  const AuthPill({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    this.filled = false,
  });

  final IconData icon;
  final String label;
  final Color color;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final background = filled
        ? color.withValues(alpha: 0.14)
        : Colors.white.withValues(alpha: 0.72);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: color.withValues(alpha: filled ? 0.16 : 0.10),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class AuthSectionHeader extends StatelessWidget {
  const AuthSectionHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    this.center = false,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final bool center;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: center
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        Text(
          eyebrow.toUpperCase(),
          textAlign: center ? TextAlign.center : TextAlign.start,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: const Color(0xFF6B7280),
            letterSpacing: 1.4,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          textAlign: center ? TextAlign.center : TextAlign.start,
          style: Theme.of(
            context,
          ).textTheme.headlineMedium?.copyWith(height: 1.08),
        ),
        const SizedBox(height: 10),
        Text(
          subtitle,
          textAlign: center ? TextAlign.center : TextAlign.start,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: const Color(0xFF6B7280),
            height: 1.45,
          ),
        ),
      ],
    );
  }
}

class _Glow extends StatelessWidget {
  const _Glow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color, color.withValues(alpha: 0.02)],
        ),
      ),
    );
  }
}

class _AuthGridPainter extends CustomPainter {
  _AuthGridPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.22)
      ..strokeWidth = 1;

    const step = 32.0;
    for (double x = 0; x <= size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y <= size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _AuthGridPainter oldDelegate) {
    return oldDelegate.color != color;
  }
}
