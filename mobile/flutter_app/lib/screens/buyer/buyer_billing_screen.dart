import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerBillingScreen extends StatelessWidget {
  const BuyerBillingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AgriCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Current Balance', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  const SizedBox(height: 4),
                  const Text('KES 450,000', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppTheme.buyerColor)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _miniStat('Pending', 'KES 120,000'),
                      const SizedBox(width: 24),
                      _miniStat('This Month', 'KES 890,000'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const AgriSectionLabel('Recent Transactions'),
            const SizedBox(height: 12),
            _transactionRow('Payment to Kiambu Coop', '-KES 155,000', 'Jun 12'),
            const SizedBox(height: 8),
            _transactionRow('Payment to Nakuru Farmers', '-KES 82,000', 'Jun 10'),
            const SizedBox(height: 8),
            _transactionRow('Deposit', '+KES 500,000', 'Jun 8'),
            const SizedBox(height: 8),
            _transactionRow('Payment to Kajiado Growers', '-KES 45,000', 'Jun 5'),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _miniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

  static Widget _transactionRow(String title, String amount, String date) {
    final isCredit = amount.startsWith('+');
    return AgriCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Icon(
            isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
            color: isCredit ? Colors.green : Colors.red,
            size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(amount, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isCredit ? Colors.green : Colors.red)),
              Text(date, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
