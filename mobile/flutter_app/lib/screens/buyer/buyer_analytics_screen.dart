import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerAnalyticsScreen extends StatelessWidget {
  const BuyerAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('Purchase Analytics'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  Container(
                    height: 160,
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text('📊 Sales analytics charts coming soon', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const AgriSectionLabel('Top Commodities'),
            const SizedBox(height: 12),
            _commodityRow('Maize', 'KES 1.2M', 0.45),
            const SizedBox(height: 8),
            _commodityRow('Beans', 'KES 680K', 0.25),
            const SizedBox(height: 8),
            _commodityRow('Tomatoes', 'KES 420K', 0.16),
            const SizedBox(height: 8),
            _commodityRow('Others', 'KES 380K', 0.14),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _commodityRow(String name, String spend, double percentage) {
    return AgriCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Expanded(flex: 2, child: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
          Expanded(
            flex: 3,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage,
                minHeight: 6,
                backgroundColor: AppTheme.border,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.buyerColor),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(spend, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
