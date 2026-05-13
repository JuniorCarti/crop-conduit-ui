import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class FarmerHomeScreen extends StatelessWidget {
  const FarmerHomeScreen({super.key});

  static const routeName = '/home/farmer';

  @override
  Widget build(BuildContext context) {
    return _HomeScaffold(
      role: 'Farmer',
      roleColor: AppTheme.farmerColor,
      icon: Icons.agriculture_rounded,
      greeting: 'Good morning, Farmer',
      tagline: 'Your farm intelligence dashboard',
      features: const [
        _FeatureItem(Icons.cloud_rounded, 'Climate Alerts', 'Rainfall & drought forecasts'),
        _FeatureItem(Icons.trending_up_rounded, 'Market Prices', 'Live crop price intelligence'),
        _FeatureItem(Icons.grass_rounded, 'Crop Planner', 'AI planting recommendations'),
        _FeatureItem(Icons.inventory_2_rounded, 'Harvest Tracker', 'Manage your produce'),
        _FeatureItem(Icons.store_rounded, 'Marketplace', 'Connect with buyers'),
        _FeatureItem(Icons.people_rounded, 'Cooperative', 'Join your cooperative'),
      ],
    );
  }
}

class BuyerHomeScreenPlaceholder extends StatelessWidget {
  const BuyerHomeScreenPlaceholder({super.key});

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}

class _HomeScaffold extends StatelessWidget {
  const _HomeScaffold({
    required this.role,
    required this.roleColor,
    required this.icon,
    required this.greeting,
    required this.tagline,
    required this.features,
  });

  final String role;
  final Color roleColor;
  final IconData icon;
  final String greeting;
  final String tagline;
  final List<_FeatureItem> features;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          // ── App bar ──────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: roleColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      roleColor,
                      roleColor.withValues(alpha: 0.8),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Image.asset(
                              'assets/brand/agrismart_logo.png',
                              height: 32,
                              color: Colors.white,
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(99),
                              ),
                              child: Row(
                                children: [
                                  Icon(icon, color: Colors.white, size: 14),
                                  const SizedBox(width: 6),
                                  Text(
                                    role,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Text(
                          greeting,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tagline,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.75),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Coming soon banner ────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: roleColor.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: roleColor.withValues(alpha: 0.15),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(Icons.construction_rounded, color: roleColor, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dashboard Coming Soon',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: roleColor,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Full $role dashboard will be available after Firebase integration.',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Feature grid ──────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.3,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final feature = features[index];
                  return _FeatureCard(feature: feature, color: roleColor);
                },
                childCount: features.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.feature, required this.color});

  final _FeatureItem feature;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(feature.icon, color: color, size: 20),
          ),
          const Spacer(),
          Text(
            feature.title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            feature.subtitle,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _FeatureItem {
  const _FeatureItem(this.icon, this.title, this.subtitle);
  final IconData icon;
  final String title;
  final String subtitle;
}
