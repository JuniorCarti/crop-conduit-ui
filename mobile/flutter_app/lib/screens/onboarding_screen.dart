import 'package:crop_conduit_flutter/screens/auth/auth_screens.dart';
import 'package:crop_conduit_flutter/theme/app_theme.dart';
import 'package:crop_conduit_flutter/widgets/auth_shell.dart';
import 'package:flutter/material.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const routeName = '/onboarding';

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  final List<_OnboardingItem> items = const [
    _OnboardingItem(
      title: 'Connect farmers, buyers, and drivers in one flow',
      description:
          'Coordinate production, transport, and sales without the usual back-and-forth.',
      asset: 'assets/brand/agrismart-farm-intelligence.png',
      accent: AppTheme.primary,
      icon: Icons.agriculture_rounded,
      highlights: ['Role-based access', 'Verified network', 'Quick setup'],
      badge: 'Team workflow',
    ),
    _OnboardingItem(
      title: 'Track logistics in real time',
      description:
          'Manage pickup schedules, delivery progress, and crop movement with fewer handoffs.',
      asset: 'assets/brand/agrismart-mark.png',
      accent: Color(0xFF2563EB),
      icon: Icons.local_shipping_rounded,
      highlights: ['Live routes', 'Delivery proof', 'Dispatch updates'],
      badge: 'Fleet visibility',
    ),
    _OnboardingItem(
      title: 'Grow with reliable market insights',
      description:
          'Use clean workflows and fast account setup to act on market opportunities with confidence.',
      asset: 'assets/brand/agrismart-full.png',
      accent: AppTheme.secondary,
      icon: Icons.auto_graph_rounded,
      highlights: ['Market signals', 'Price intelligence', 'Faster decisions'],
      badge: 'Smart growth',
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _next() {
    if (_page < items.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
      return;
    }
    Navigator.of(context).pushReplacementNamed(AuthLandingScreen.routeName);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const AuthBackdrop(
            primaryColor: AppTheme.primary,
            secondaryColor: AppTheme.secondary,
            tertiaryColor: Color(0xFF2563EB),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              child: Column(
                children: [
                  Row(
                    children: [
                      AuthPill(
                        icon: Icons.timeline_rounded,
                        label: 'Step ${_page + 1}/3',
                        color: items[_page].accent,
                        filled: true,
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          Navigator.of(
                            context,
                          ).pushReplacementNamed(AuthLandingScreen.routeName);
                        },
                        child: const Text('Skip'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: PageView.builder(
                      controller: _controller,
                      onPageChanged: (index) => setState(() => _page = index),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: AuthSurfaceCard(
                            padding: const EdgeInsets.all(22),
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                item.accent.withValues(alpha: 0.14),
                                Colors.white,
                                item.accent.withValues(alpha: 0.05),
                              ],
                            ),
                            borderColor: item.accent.withValues(alpha: 0.16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    AuthPill(
                                      icon: item.icon,
                                      label: item.badge,
                                      color: item.accent,
                                      filled: true,
                                    ),
                                    const Spacer(),
                                    Text(
                                      '0${index + 1}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelLarge
                                          ?.copyWith(
                                            color: item.accent,
                                            fontWeight: FontWeight.w800,
                                          ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 18),
                                Container(
                                  height: 250,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                      colors: [
                                        item.accent.withValues(alpha: 0.22),
                                        Colors.white,
                                        item.accent.withValues(alpha: 0.08),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(28),
                                    border: Border.all(
                                      color: item.accent.withValues(
                                        alpha: 0.12,
                                      ),
                                    ),
                                  ),
                                  child: Stack(
                                    children: [
                                      Positioned(
                                        top: -22,
                                        left: -18,
                                        child: Container(
                                          width: 120,
                                          height: 120,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: item.accent.withValues(
                                              alpha: 0.12,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        bottom: -28,
                                        right: -14,
                                        child: Container(
                                          width: 140,
                                          height: 140,
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: item.accent.withValues(
                                              alpha: 0.08,
                                            ),
                                          ),
                                        ),
                                      ),
                                      Center(
                                        child: Padding(
                                          padding: const EdgeInsets.all(30),
                                          child: Image.asset(
                                            item.asset,
                                            fit: BoxFit.contain,
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        left: 16,
                                        right: 16,
                                        bottom: 16,
                                        child: AuthSurfaceCard(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 12,
                                          ),
                                          borderRadius: 20,
                                          backgroundColor: Colors.white
                                              .withValues(alpha: 0.9),
                                          borderColor: item.accent.withValues(
                                            alpha: 0.10,
                                          ),
                                          child: Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  'Designed for modern farm teams.',
                                                  style: Theme.of(context)
                                                      .textTheme
                                                      .labelLarge
                                                      ?.copyWith(
                                                        color: AppTheme
                                                            .textPrimary,
                                                      ),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Icon(
                                                Icons.arrow_forward_rounded,
                                                color: item.accent,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 22),
                                Text(
                                  item.title,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.headlineSmall,
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  item.description,
                                  style: Theme.of(context).textTheme.bodyLarge
                                      ?.copyWith(
                                        color: AppTheme.textMuted,
                                        height: 1.45,
                                      ),
                                ),
                                const SizedBox(height: 18),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: item.highlights
                                      .map(
                                        (highlight) => AuthPill(
                                          icon: Icons.check_rounded,
                                          label: highlight,
                                          color: item.accent,
                                          filled: true,
                                        ),
                                      )
                                      .toList(),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      items.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 260),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _page == index ? 28 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _page == index
                              ? items[_page].accent
                              : items[_page].accent.withValues(alpha: 0.22),
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.of(
                              context,
                            ).pushReplacementNamed(AuthLandingScreen.routeName);
                          },
                          child: const Text('Skip'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _next,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: items[_page].accent,
                            foregroundColor: Colors.white,
                          ),
                          child: Text(
                            _page == items.length - 1 ? 'Get started' : 'Next',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingItem {
  const _OnboardingItem({
    required this.title,
    required this.description,
    required this.asset,
    required this.accent,
    required this.icon,
    required this.highlights,
    required this.badge,
  });

  final String title;
  final String description;
  final String asset;
  final Color accent;
  final IconData icon;
  final List<String> highlights;
  final String badge;
}
