import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerResourcesScreen extends StatelessWidget {
  const FarmerResourcesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resources'),
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
            const AgriSectionLabel('Input Tracking'),
            const SizedBox(height: 12),
            _resourceCard('Seeds', 'Maize DH04', '25 kg remaining', Icons.grain_rounded, Colors.amber),
            const SizedBox(height: 12),
            _resourceCard('Fertilizer', 'DAP', '3 bags (150 kg)', Icons.science_rounded, Colors.blue),
            const SizedBox(height: 12),
            _resourceCard('Pesticide', 'Neem Oil', '5 litres', Icons.bug_report_rounded, Colors.red),
            const SizedBox(height: 12),
            _resourceCard('Tools', 'Sprayer', '1 unit (Good condition)', Icons.build_rounded, Colors.grey),
            const SizedBox(height: 24),
            AgriCard(
              child: Column(
                children: [
                  const Icon(Icons.inventory_rounded, size: 48, color: AppTheme.primary),
                  const SizedBox(height: 12),
                  const Text(
                    'Full inventory management coming soon',
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

  static Widget _resourceCard(String category, String name, String quantity, IconData icon, Color color) {
    return AgriCard(
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(category, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Text(quantity, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
