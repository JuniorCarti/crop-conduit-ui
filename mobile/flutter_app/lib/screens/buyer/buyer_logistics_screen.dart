import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerLogisticsScreen extends StatelessWidget {
  const BuyerLogisticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Logistics'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('Active Shipments'),
            const SizedBox(height: 12),
            _shipmentCard('SHP-001', 'Kiambu → Nairobi', 'In Transit', 0.6),
            const SizedBox(height: 12),
            _shipmentCard('SHP-002', 'Nakuru → Mombasa', 'Loading', 0.2),
            const SizedBox(height: 12),
            _shipmentCard('SHP-003', 'Eldoret → Nairobi', 'Delivered', 1.0),
            const SizedBox(height: 24),
            AgriCard(
              child: Column(
                children: [
                  const Icon(Icons.map_rounded, size: 48, color: AppTheme.buyerColor),
                  const SizedBox(height: 12),
                  const Text(
                    'Live tracking map coming soon',
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

  static Widget _shipmentCard(String id, String route, String status, double progress) {
    final color = status == 'Delivered' ? Colors.green : status == 'In Transit' ? Colors.blue : Colors.orange;
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_shipping_rounded, size: 20, color: AppTheme.buyerColor),
              const SizedBox(width: 8),
              Expanded(child: Text(id, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
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
          const SizedBox(height: 8),
          Text(route, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ],
      ),
    );
  }
}
