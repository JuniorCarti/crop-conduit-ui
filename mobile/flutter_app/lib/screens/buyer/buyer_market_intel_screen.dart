import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerMarketIntelScreen extends StatelessWidget {
  const BuyerMarketIntelScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Market Intelligence')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.insights_rounded, size: 72, color: AppTheme.buyerColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Market Intelligence', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Access real-time market data, price trends, and competitive intelligence to make informed procurement decisions.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.trending_up_rounded, 'Price Trends'),
                  const Divider(height: 16),
                  _featureRow(Icons.map_rounded, 'Regional Analysis'),
                  const Divider(height: 16),
                  _featureRow(Icons.compare_arrows_rounded, 'Competitive Pricing'),
                  const Divider(height: 16),
                  _featureRow(Icons.notifications_active_rounded, 'Price Alerts'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Coming Soon', style: TextStyle(color: AppTheme.buyerColor, fontWeight: FontWeight.w600, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  static Widget _featureRow(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.buyerColor),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
