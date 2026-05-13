import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerMarketplaceScreen extends StatelessWidget {
  const FarmerMarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Marketplace'),
          bottom: const TabBar(
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorColor: AppTheme.primary,
            tabs: [
              Tab(text: 'Browse'),
              Tab(text: 'My Listings'),
              Tab(text: 'Transactions'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Browse Tab
            GridView.builder(
              padding: const EdgeInsets.all(24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              itemCount: 6,
              itemBuilder: (context, index) {
                final items = [
                  ('Maize', 'KES 3,200/bag', '50 bags'),
                  ('Beans', 'KES 8,500/bag', '20 bags'),
                  ('Tomatoes', 'KES 4,800/crate', '30 crates'),
                  ('Potatoes', 'KES 2,500/bag', '100 bags'),
                  ('Onions', 'KES 3,000/bag', '40 bags'),
                  ('Cabbage', 'KES 1,200/head', '200 heads'),
                ];
                final item = items[index];
                return _listingCard(item.$1, item.$2, item.$3);
              },
            ),
            // My Listings Tab
            _placeholderContent(Icons.storefront_rounded, 'My Listings', 'Create and manage your produce listings'),
            // Transactions Tab
            _placeholderContent(Icons.receipt_long_rounded, 'Transactions', 'Track your sales and purchases'),
          ],
        ),
      ),
    );
  }

  static Widget _listingCard(String name, String price, String quantity) {
    return AgriCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Icon(Icons.grass_rounded, size: 32, color: AppTheme.primary.withValues(alpha: 0.4)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            name,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            price,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            quantity,
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  static Widget _placeholderContent(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppTheme.primary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(fontSize: 14, color: AppTheme.textMuted)),
          const SizedBox(height: 24),
          const Text('Coming Soon', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
