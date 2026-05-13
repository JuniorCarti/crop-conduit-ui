import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportPoolingScreen extends StatelessWidget {
  const TransportPoolingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shared Pooling')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.group_work_rounded, size: 72, color: AppTheme.driverColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Shared Transport Pooling', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Optimize routes by pooling shipments from multiple farmers heading to the same destination.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.route_rounded, 'Route Optimization'),
                  const Divider(height: 16),
                  _featureRow(Icons.people_rounded, 'Multi-Farmer Loads'),
                  const Divider(height: 16),
                  _featureRow(Icons.savings_rounded, 'Cost Sharing'),
                  const Divider(height: 16),
                  _featureRow(Icons.schedule_rounded, 'Scheduled Pickups'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Coming Soon', style: TextStyle(color: AppTheme.driverColor, fontWeight: FontWeight.w600, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  static Widget _featureRow(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.driverColor),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
