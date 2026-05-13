import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerReportsScreen extends StatelessWidget {
  const BuyerReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('Custom Reports'),
            const SizedBox(height: 12),
            _reportCard('Monthly Purchase Summary', 'Last generated: Jun 1', Icons.summarize_rounded),
            const SizedBox(height: 12),
            _reportCard('Supplier Performance', 'Last generated: May 28', Icons.assessment_rounded),
            const SizedBox(height: 12),
            _reportCard('Cost Analysis', 'Last generated: May 25', Icons.pie_chart_rounded),
            const SizedBox(height: 24),
            AgriCard(
              child: Column(
                children: [
                  const Icon(Icons.summarize_rounded, size: 48, color: AppTheme.buyerColor),
                  const SizedBox(height: 12),
                  const Text('Custom report builder coming soon', style: TextStyle(fontSize: 14, color: AppTheme.textMuted), textAlign: TextAlign.center),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _reportCard(String title, String subtitle, IconData icon) {
    return AgriCard(
      child: Row(
        children: [
          Icon(icon, color: AppTheme.buyerColor, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          const Icon(Icons.download_rounded, size: 20, color: AppTheme.textMuted),
        ],
      ),
    );
  }
}
