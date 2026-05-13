import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerFinancialScreen extends StatelessWidget {
  const BuyerFinancialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Financial Management')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.account_balance_rounded, size: 72, color: AppTheme.buyerColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Financial Management', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Manage budgets, track expenses, and monitor financial performance of your procurement operations.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.account_balance_wallet_rounded, 'Budget Management'),
                  const Divider(height: 16),
                  _featureRow(Icons.receipt_long_rounded, 'Expense Tracking'),
                  const Divider(height: 16),
                  _featureRow(Icons.trending_up_rounded, 'Financial Reports'),
                  const Divider(height: 16),
                  _featureRow(Icons.payments_rounded, 'Payment Processing'),
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
