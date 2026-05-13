import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportTrackingScreen extends StatelessWidget {
  const TransportTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fleet Tracking')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            // Map placeholder
            Expanded(
              flex: 3,
              child: AgriCard(
                padding: EdgeInsets.zero,
                child: Container(
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.map_rounded, size: 64, color: AppTheme.driverColor.withValues(alpha: 0.3)),
                        const SizedBox(height: 16),
                        const Text('Real-time Fleet Map', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        const Text('Live GPS tracking coming soon', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Vehicle list
            Expanded(
              flex: 2,
              child: ListView(
                children: [
                  _trackingItem('KBZ 123A', 'Kiambu Road', '45 km/h'),
                  const SizedBox(height: 8),
                  _trackingItem('KCA 456B', 'Nakuru Highway', '80 km/h'),
                  const SizedBox(height: 8),
                  _trackingItem('KBB 321D', 'Eldoret-Nairobi', '65 km/h'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _trackingItem(String plate, String location, String speed) {
    return AgriCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          const Icon(Icons.gps_fixed_rounded, size: 18, color: AppTheme.driverColor),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(plate, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                Text(location, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Text(speed, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.driverColor)),
        ],
      ),
    );
  }
}
