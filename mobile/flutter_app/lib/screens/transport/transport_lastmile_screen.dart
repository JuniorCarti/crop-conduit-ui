import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportLastmileScreen extends StatelessWidget {
  const TransportLastmileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Last-Mile Optimization')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.route_rounded, size: 72, color: AppTheme.driverColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Last-Mile Optimization', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Optimize final delivery routes to reduce costs and ensure timely delivery of fresh produce.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.alt_route_rounded, 'Route Planning'),
                  const Divider(height: 16),
                  _featureRow(Icons.delivery_dining_rounded, 'Delivery Scheduling'),
                  const Divider(height: 16),
                  _featureRow(Icons.speed_rounded, 'Time Optimization'),
                  const Divider(height: 16),
                  _featureRow(Icons.local_gas_station_rounded, 'Fuel Efficiency'),
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
