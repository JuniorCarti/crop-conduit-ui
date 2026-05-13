import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerFinanceScreen extends StatelessWidget {
  const FarmerFinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finance'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                SizedBox(width: 4),
                Text('Premium', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.amber)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary Cards
            Row(
              children: [
                Expanded(child: _summaryCard('Revenue', 'KES 245,000', Colors.green, Icons.arrow_upward_rounded)),
                const SizedBox(width: 12),
                Expanded(child: _summaryCard('Costs', 'KES 89,000', Colors.red, Icons.arrow_downward_rounded)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _summaryCard('Profit', 'KES 156,000', Colors.blue, Icons.account_balance_wallet_rounded)),
                const SizedBox(width: 12),
                Expanded(child: _summaryCard('ROI', '175%', Colors.purple, Icons.trending_up_rounded)),
              ],
            ),
            const SizedBox(height: 24),

            const AgriSectionLabel('Cost Breakdown'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  _costRow('Seeds & Seedlings', 'KES 25,000', 0.28),
                  const SizedBox(height: 10),
                  _costRow('Fertilizer', 'KES 32,000', 0.36),
                  const SizedBox(height: 10),
                  _costRow('Labour', 'KES 18,000', 0.20),
                  const SizedBox(height: 10),
                  _costRow('Transport', 'KES 8,000', 0.09),
                  const SizedBox(height: 10),
                  _costRow('Other', 'KES 6,000', 0.07),
                ],
              ),
            ),
            const SizedBox(height: 24),

            AgriCard(
              child: Column(
                children: [
                  const Icon(Icons.analytics_rounded, size: 48, color: AppTheme.primary),
                  const SizedBox(height: 12),
                  const Text(
                    'Detailed financial analytics coming soon',
                    style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _summaryCard(String label, String value, Color color, IconData icon) {
    return AgriCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  static Widget _costRow(String label, String amount, double percentage) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ),
        Expanded(
          flex: 4,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percentage,
              minHeight: 6,
              backgroundColor: AppTheme.border,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 80,
          child: Text(amount, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.right),
        ),
      ],
    );
  }
}
