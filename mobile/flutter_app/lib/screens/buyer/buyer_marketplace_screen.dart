import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerMarketplaceScreen extends StatelessWidget {
  const BuyerMarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list_rounded), onPressed: () {}),
          IconButton(icon: const Icon(Icons.search_rounded), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: const Row(
                children: [
                  Icon(Icons.search_rounded, color: AppTheme.textMuted, size: 20),
                  SizedBox(width: 8),
                  Text('Search produce, suppliers...', style: TextStyle(color: AppTheme.textMuted, fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Categories
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _categoryChip('All', true),
                  _categoryChip('Cereals', false),
                  _categoryChip('Vegetables', false),
                  _categoryChip('Fruits', false),
                  _categoryChip('Dairy', false),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Listings
            const AgriSectionLabel('Available Listings'),
            const SizedBox(height: 12),
            _listingCard('Premium Maize', 'Kiambu Cooperative', 'KES 3,100/bag', '500 bags', 4.8),
            const SizedBox(height: 12),
            _listingCard('Grade A Beans', 'Nakuru Farmers Union', 'KES 8,200/bag', '200 bags', 4.5),
            const SizedBox(height: 12),
            _listingCard('Fresh Tomatoes', 'Kajiado Growers', 'KES 4,500/crate', '100 crates', 4.9),
            const SizedBox(height: 12),
            _listingCard('Organic Potatoes', 'Nyandarua Farms', 'KES 2,800/bag', '300 bags', 4.3),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _categoryChip(String label, bool selected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        label: Text(label),
        backgroundColor: selected ? AppTheme.buyerColor.withValues(alpha: 0.1) : AppTheme.surface,
        side: BorderSide(color: selected ? AppTheme.buyerColor : AppTheme.border),
        labelStyle: TextStyle(
          color: selected ? AppTheme.buyerColor : AppTheme.textMuted,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          fontSize: 13,
        ),
      ),
    );
  }

  static Widget _listingCard(String name, String supplier, String price, String qty, double rating) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                  const SizedBox(width: 2),
                  Text('$rating', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(supplier, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.buyerColor)),
              const Spacer(),
              Text(qty, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
