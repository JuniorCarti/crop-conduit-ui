import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerMarketScreen extends StatelessWidget {
  const FarmerMarketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Market Oracle'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Commodity Selector
            const AgriSectionLabel('Select Commodity'),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _commodityChip('Maize', true),
                  _commodityChip('Beans', false),
                  _commodityChip('Wheat', false),
                  _commodityChip('Tomatoes', false),
                  _commodityChip('Potatoes', false),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Price Predictions
            const AgriSectionLabel('Price Predictions'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Maize - 7 Day Forecast',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          '↑ Bullish',
                          style: TextStyle(
                            color: Colors.green,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text(
                        '📈 Price chart coming soon',
                        style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Today's Prices
            const AgriSectionLabel("Today's Prices"),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  _priceRow('Nairobi', 'KES 3,200', '+2.1%'),
                  const Divider(height: 16),
                  _priceRow('Mombasa', 'KES 3,450', '+1.8%'),
                  const Divider(height: 16),
                  _priceRow('Kisumu', 'KES 2,900', '-0.3%'),
                  const Divider(height: 16),
                  _priceRow('Nakuru', 'KES 3,100', '+0.5%'),
                  const Divider(height: 16),
                  _priceRow('Eldoret', 'KES 2,850', '+1.2%'),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _commodityChip(String label, bool selected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        label: Text(label),
        backgroundColor: selected ? AppTheme.primary.withValues(alpha: 0.1) : AppTheme.surface,
        side: BorderSide(
          color: selected ? AppTheme.primary : AppTheme.border,
        ),
        labelStyle: TextStyle(
          color: selected ? AppTheme.primary : AppTheme.textMuted,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          fontSize: 13,
        ),
      ),
    );
  }

  static Widget _priceRow(String market, String price, String change) {
    final isUp = change.startsWith('+');
    return Row(
      children: [
        Expanded(
          child: Text(
            market,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          price,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(width: 8),
        Text(
          change,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isUp ? Colors.green : Colors.red,
          ),
        ),
      ],
    );
  }
}
