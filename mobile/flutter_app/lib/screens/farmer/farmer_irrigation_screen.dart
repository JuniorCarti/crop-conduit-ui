import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerIrrigationScreen extends StatelessWidget {
  const FarmerIrrigationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Irrigation'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                SizedBox(width: 4),
                Text('Premium', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.amber)),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Water Status
            AgriCard(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.water_drop_rounded, color: Colors.blue, size: 24),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Water Level', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        Text('75% Capacity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  const Text('3,750 L', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.blue)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const AgriSectionLabel('Watering Schedule'),
            const SizedBox(height: 12),
            _scheduleCard('Field A - Maize', 'Tomorrow 6:00 AM', '45 min', true),
            const SizedBox(height: 12),
            _scheduleCard('Field B - Beans', 'Today 5:30 PM', '30 min', false),
            const SizedBox(height: 12),
            _scheduleCard('Greenhouse', 'Daily 7:00 AM', '20 min', true),
            const SizedBox(height: 24),

            const AgriSectionLabel('Soil Moisture'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  _moistureRow('Field A', 0.65, 'Optimal'),
                  const SizedBox(height: 12),
                  _moistureRow('Field B', 0.45, 'Needs Water'),
                  const SizedBox(height: 12),
                  _moistureRow('Greenhouse', 0.72, 'Optimal'),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _scheduleCard(String field, String time, String duration, bool active) {
    return AgriCard(
      child: Row(
        children: [
          Icon(
            active ? Icons.check_circle_rounded : Icons.schedule_rounded,
            color: active ? Colors.green : Colors.orange,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(field, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(time, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Text(duration, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  static Widget _moistureRow(String field, double value, String status) {
    final color = value > 0.6 ? Colors.green : value > 0.4 ? Colors.orange : Colors.red;
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(field, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ),
        Expanded(
          flex: 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: value,
              minHeight: 6,
              backgroundColor: AppTheme.border,
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}
