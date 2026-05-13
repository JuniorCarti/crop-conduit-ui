import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerQualityScreen extends StatelessWidget {
  const BuyerQualityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quality Management')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.verified_rounded, size: 72, color: AppTheme.buyerColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Quality Management', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Track quality inspections, certifications, and compliance for all your produce purchases.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.fact_check_rounded, 'Quality Inspections'),
                  const Divider(height: 16),
                  _featureRow(Icons.workspace_premium_rounded, 'Certifications'),
                  const Divider(height: 16),
                  _featureRow(Icons.rule_rounded, 'Compliance Tracking'),
                  const Divider(height: 16),
                  _featureRow(Icons.camera_alt_rounded, 'Photo Documentation'),
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
