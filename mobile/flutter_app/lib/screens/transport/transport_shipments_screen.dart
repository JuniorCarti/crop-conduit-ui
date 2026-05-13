import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportShipmentsScreen extends StatelessWidget {
  const TransportShipmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Shipments'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _shipmentCard(
            'SHP-001',
            'Kiambu → Nairobi CBD',
            'Maize - 5 tonnes',
            'In Transit',
            0.65,
            'ETA: 1h 30m',
          ),
          const SizedBox(height: 12),
          _shipmentCard(
            'SHP-002',
            'Nakuru → Mombasa',
            'Mixed produce - 8 tonnes',
            'Loading',
            0.15,
            'Departs: 2:00 PM',
          ),
          const SizedBox(height: 12),
          _shipmentCard(
            'SHP-003',
            'Eldoret → Nairobi',
            'Wheat - 10 tonnes',
            'Delivered',
            1.0,
            'Completed 9:30 AM',
          ),
          const SizedBox(height: 12),
          _shipmentCard(
            'SHP-004',
            'Meru → Nairobi',
            'Coffee - 3 tonnes',
            'Scheduled',
            0.0,
            'Tomorrow 6:00 AM',
          ),
        ],
      ),
    );
  }

  static Widget _shipmentCard(
      String id, String route, String cargo, String status, double progress, String detail) {
    final color = switch (status) {
      'In Transit' => Colors.blue,
      'Loading' => Colors.orange,
      'Delivered' => Colors.green,
      _ => Colors.grey,
    };
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(id, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const Spacer(),
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
          Row(
            children: [
              const Icon(Icons.route_rounded, size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(route, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            ],
          ),
          const SizedBox(height: 4),
          Text(cargo, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
          const SizedBox(height: 6),
          Text(detail, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
