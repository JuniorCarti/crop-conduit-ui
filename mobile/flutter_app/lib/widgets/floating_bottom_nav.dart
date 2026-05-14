import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// A floating pill-shaped bottom navigation bar.
/// Active item gets a filled circle background.
class FloatingBottomNav extends StatelessWidget {
  const FloatingBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.activeColor,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<FloatingNavItem> items;
  final Color? activeColor;

  @override
  Widget build(BuildContext context) {
    final color = activeColor ?? AppTheme.primary;

    return Container(
      padding: const EdgeInsets.only(bottom: 20, left: 24, right: 24, top: 8),
      color: Colors.transparent,
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(
            color: AppTheme.border.withValues(alpha: 0.5),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(items.length, (index) {
            final item = items[index];
            final isActive = index == currentIndex;

            return GestureDetector(
              onTap: () => onTap(index),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isActive
                      ? color
                      : Colors.transparent,
                ),
                child: Icon(
                  isActive ? item.activeIcon : item.icon,
                  size: 24,
                  color: isActive
                      ? Colors.white
                      : AppTheme.textMuted,
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class FloatingNavItem {
  const FloatingNavItem({
    required this.icon,
    this.activeIcon,
    this.label = '',
  });

  final IconData icon;
  final IconData? activeIcon;
  final String label;
}
