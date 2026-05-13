import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportColdChainScreen extends StatelessWidget {
  const TransportColdChainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cold Chain Monitoring')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.ac_unit_rounded, size: 72, color: AppTheme.driverColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Cold Chain Monitoring', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Monitor temperature and humidity in refrigerated vehicles to ensure produce quality during transport.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.thermostat_rounded, 'Temperature Monitoring'),
                  const Divider(height: 16),
                  _featureRow(Icons.water_drop_rounded, 'Humidity Tracking'),
                  const Divider(height: 16),
                  _featureRow(Icons.warning_rounded, 'Alert Notifications'),
                  const Divider(height: 16),
                  _featureRow(Icons.history_rounded, 'Temperature History'),
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
