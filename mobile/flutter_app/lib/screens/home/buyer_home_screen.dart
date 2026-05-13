import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class BuyerHomeScreen extends StatelessWidget {
  const BuyerHomeScreen({super.key});

  static const routeName = '/home/buyer';

  @override
  Widget build(BuildContext context) {
    return _BuyerScaffold();
  }
}

class _BuyerScaffold extends StatelessWidget {
  const _BuyerScaffold();

  static const _features = [
    _FeatureItem(Icons.store_rounded, 'Marketplace', 'Browse produce listings'),
    _FeatureItem(Icons.trending_up_rounded, 'Market Intel', 'Price & demand signals'),
    _FeatureItem(Icons.handshake_rounded, 'Trade Bids', 'Place and manage bids'),
    _FeatureItem(Icons.description_rounded, 'Contracts', 'Trade agreements'),
    _FeatureItem(Icons.local_shipping_rounded, 'Logistics', 'Track deliveries'),
    _FeatureItem(Icons.account_balance_wallet_rounded, 'Wallet', 'Payments & billing'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppTheme.buyerColor,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.buyerColor,
                      AppTheme.buyerColor.withValues(alpha: 0.75),
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
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(99),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.store_rounded, color: Colors.white, size: 14),
                                  SizedBox(width: 6),
                                  Text('Buyer', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Good morning, Buyer',
                          style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700, height: 1.2),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your sourcing & trade dashboard',
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.buyerColor.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.buyerColor.withValues(alpha: 0.15)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.construction_rounded, color: AppTheme.buyerColor, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Dashboard Coming Soon', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.buyerColor)),
                          const SizedBox(height: 2),
                          const Text('Full Buyer dashboard will be available after Firebase integration.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

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
                  final f = _features[index];
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: AppTheme.buyerColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(f.icon, color: AppTheme.buyerColor, size: 20),
                        ),
                        const Spacer(),
                        Text(f.title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                        const SizedBox(height: 2),
                        Text(f.subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted), maxLines: 2, overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  );
                },
                childCount: _features.length,
              ),
            ),
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
