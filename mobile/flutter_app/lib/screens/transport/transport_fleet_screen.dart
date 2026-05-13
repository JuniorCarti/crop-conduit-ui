import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportFleetScreen extends StatelessWidget {
  const TransportFleetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fleet Management'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.add_rounded), onPressed: () {}),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _vehicleCard('KBZ 123A', 'Toyota Dyna', '3 Tonne', 'Available', Colors.green),
          const SizedBox(height: 12),
          _vehicleCard('KCA 456B', 'Isuzu FRR', '5 Tonne', 'In Transit', Colors.blue),
          const SizedBox(height: 12),
          _vehicleCard('KDA 789C', 'Mitsubishi Canter', '2 Tonne', 'Available', Colors.green),
          const SizedBox(height: 12),
          _vehicleCard('KBB 321D', 'Hino 300', '4 Tonne', 'In Transit', Colors.blue),
          const SizedBox(height: 12),
          _vehicleCard('KCE 654E', 'Toyota Dyna', '3 Tonne', 'Maintenance', Colors.red),
          const SizedBox(height: 12),
          _vehicleCard('KDF 987F', 'Isuzu NQR', '7 Tonne', 'Available', Colors.green),
          const SizedBox(height: 12),
          _vehicleCard('KBA 147G', 'Mitsubishi FE', '3 Tonne', 'Available', Colors.green),
          const SizedBox(height: 12),
          _vehicleCard('KCC 258H', 'Hino 500', '10 Tonne', 'Available', Colors.green),
        ],
      ),
    );
  }

  static Widget _vehicleCard(String plate, String model, String capacity, String status, Color statusColor) {
    return AgriCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.driverColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.local_shipping_rounded, color: AppTheme.driverColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$model ($plate)', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(capacity, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
          ),
        ],
      ),
    );
  }
}
