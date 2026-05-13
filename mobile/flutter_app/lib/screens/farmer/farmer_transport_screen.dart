import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerTransportScreen extends StatelessWidget {
  const FarmerTransportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Transport Booking'),
          bottom: const TabBar(
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorColor: AppTheme.primary,
            tabs: [
              Tab(text: 'Available'),
              Tab(text: 'My Shipments'),
              Tab(text: 'Book'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Available Vehicles
            ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _vehicleCard('Toyota Dyna', '3 Tonne', 'Nairobi → Nakuru', 'KES 15,000', true),
                const SizedBox(height: 12),
                _vehicleCard('Isuzu FRR', '5 Tonne', 'Nairobi → Mombasa', 'KES 45,000', true),
                const SizedBox(height: 12),
                _vehicleCard('Mitsubishi Canter', '2 Tonne', 'Local Delivery', 'KES 8,000', false),
              ],
            ),
            // My Shipments
            _placeholderContent(Icons.inventory_2_rounded, 'My Shipments', 'Track your active and past shipments'),
            // Book Transport
            _placeholderContent(Icons.add_circle_outline_rounded, 'Book Transport', 'Request a vehicle for your produce'),
          ],
        ),
      ),
    );
  }

  static Widget _vehicleCard(String name, String capacity, String route, String price, bool available) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_shipping_rounded, color: AppTheme.primary, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    Text(capacity, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (available ? Colors.green : Colors.orange).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  available ? 'Available' : 'Busy',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: available ? Colors.green : Colors.orange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.route_rounded, size: 14, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(route, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const Spacer(),
              Text(price, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primary)),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _placeholderContent(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppTheme.primary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(fontSize: 14, color: AppTheme.textMuted)),
          const SizedBox(height: 24),
          const Text('Coming Soon', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
