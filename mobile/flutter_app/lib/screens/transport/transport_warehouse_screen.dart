import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportWarehouseScreen extends StatelessWidget {
  const TransportWarehouseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Warehouse Management')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.warehouse_rounded, size: 72, color: AppTheme.driverColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Warehouse Management', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Manage warehouse capacity, inventory, and loading/unloading schedules for efficient logistics.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.inventory_2_rounded, 'Inventory Management'),
                  const Divider(height: 16),
                  _featureRow(Icons.space_dashboard_rounded, 'Capacity Planning'),
                  const Divider(height: 16),
                  _featureRow(Icons.schedule_rounded, 'Loading Schedules'),
                  const Divider(height: 16),
                  _featureRow(Icons.qr_code_scanner_rounded, 'Barcode Scanning'),
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
