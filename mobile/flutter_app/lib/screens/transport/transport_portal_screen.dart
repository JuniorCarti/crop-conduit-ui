import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportPortalScreen extends StatelessWidget {
  const TransportPortalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Transport Portal'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome, Transporter 🚛', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text('Your fleet overview', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 24),

            // Status Cards
            Row(
              children: [
                Expanded(child: _statusCard('Fleet Size', '8', Icons.directions_car_rounded, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _statusCard('Available', '5', Icons.check_circle_rounded, Colors.green)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _statusCard('In Transit', '2', Icons.local_shipping_rounded, Colors.orange)),
                const SizedBox(width: 12),
                Expanded(child: _statusCard('Maintenance', '1', Icons.build_rounded, Colors.red)),
              ],
            ),
            const SizedBox(height: 24),

            // Active Jobs
            const AgriSectionLabel('Active Jobs'),
            const SizedBox(height: 12),
            _jobCard('Kiambu → Nairobi', 'Maize - 5 tonnes', 'In Transit', '2h remaining'),
            const SizedBox(height: 12),
            _jobCard('Nakuru → Mombasa', 'Mixed produce', 'Loading', 'Departs 2:00 PM'),
            const SizedBox(height: 24),

            // Revenue
            const AgriSectionLabel('This Month'),
            const SizedBox(height: 12),
            AgriCard(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _revenueItem('Revenue', 'KES 320K', Colors.green),
                  _revenueItem('Trips', '24', Colors.blue),
                  _revenueItem('Distance', '4,200 km', Colors.purple),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _statusCard(String label, String value, IconData icon, Color color) {
    return AgriCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  static Widget _jobCard(String route, String cargo, String status, String eta) {
    final color = status == 'In Transit' ? Colors.blue : Colors.orange;
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.route_rounded, size: 18, color: AppTheme.driverColor),
              const SizedBox(width: 8),
              Expanded(child: Text(route, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Text(cargo, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const Spacer(),
              Text(eta, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _revenueItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
      ],
    );
  }
}
