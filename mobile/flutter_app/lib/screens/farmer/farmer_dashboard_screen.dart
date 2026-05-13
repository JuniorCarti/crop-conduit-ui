import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerDashboardScreen extends StatelessWidget {
  const FarmerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting
            Text(
              'Good Morning, Farmer 🌱',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 4),
            Text(
              'Here\'s your farm overview for today',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),

            // Field Pulse
            const AgriSectionLabel('Field Pulse'),
            const SizedBox(height: 12),
            AgriCard(
              child: Row(
                children: [
                  _pulseItem(Icons.thermostat_rounded, '24°C', 'Temp'),
                  _pulseItem(Icons.water_drop_rounded, '65%', 'Moisture'),
                  _pulseItem(Icons.ac_unit_rounded, 'Low', 'Frost Risk'),
                  _pulseItem(Icons.air_rounded, '12 km/h', 'Wind'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Quick Actions
            const AgriSectionLabel('Quick Actions'),
            const SizedBox(height: 12),
            Row(
              children: [
                _quickAction(context, Icons.cloud_rounded, 'Climate', AppTheme.primary),
                const SizedBox(width: 12),
                _quickAction(context, Icons.trending_up_rounded, 'Market', Colors.blue),
                const SizedBox(width: 12),
                _quickAction(context, Icons.grass_rounded, 'Harvest', Colors.orange),
                const SizedBox(width: 12),
                _quickAction(context, Icons.record_voice_over_rounded, 'Asha', Colors.purple),
              ],
            ),
            const SizedBox(height: 24),

            // Farm Health
            const AgriSectionLabel('Farm Health'),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _healthCard('Soil pH', '6.5', Icons.landscape_rounded, Colors.brown),
                _healthCard('Crop Stage', 'Flowering', Icons.local_florist_rounded, Colors.pink),
                _healthCard('Irrigation', 'On Track', Icons.water_drop_rounded, Colors.blue),
                _healthCard('Pests', 'None', Icons.bug_report_rounded, Colors.green),
              ],
            ),
            const SizedBox(height: 24),

            // Market Snapshot
            const AgriSectionLabel('Market Snapshot'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  _marketRow('Maize', 'KES 3,200/bag', '+2.1%', true),
                  const Divider(height: 16),
                  _marketRow('Beans', 'KES 8,500/bag', '-0.5%', false),
                  const Divider(height: 16),
                  _marketRow('Tomatoes', 'KES 4,800/crate', '+5.3%', true),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Upcoming Events
            const AgriSectionLabel('Upcoming Events'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  _eventRow('Harvest Day - Maize', 'In 3 days', Icons.event_rounded),
                  const SizedBox(height: 12),
                  _eventRow('Cooperative Meeting', 'Next Monday', Icons.groups_rounded),
                  const SizedBox(height: 12),
                  _eventRow('Market Day - Nairobi', 'Wednesday', Icons.store_rounded),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _pulseItem(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: AppTheme.primary, size: 22),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  static Widget _quickAction(BuildContext context, IconData icon, String label, Color color) {
    return Expanded(
      child: AgriCard(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _healthCard(String title, String value, IconData icon, Color color) {
    return AgriCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 24),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: AppTheme.textPrimary,
            ),
          ),
          Text(
            title,
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  static Widget _marketRow(String crop, String price, String change, bool up) {
    return Row(
      children: [
        Expanded(
          child: Text(
            crop,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ),
        Text(
          price,
          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: (up ? Colors.green : Colors.red).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            change,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: up ? Colors.green : Colors.red,
            ),
          ),
        ),
      ],
    );
  }

  static Widget _eventRow(String title, String time, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
        Text(
          time,
          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
        ),
      ],
    );
  }
}
