import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerCooperativesScreen extends StatelessWidget {
  const FarmerCooperativesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cooperatives')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('My Cooperatives'),
            const SizedBox(height: 12),
            _coopCard('Kiambu Farmers Cooperative', '245 members', 'Active', true),
            const SizedBox(height: 12),
            _coopCard('Central Kenya Maize Growers', '1,200 members', 'Active', true),
            const SizedBox(height: 24),
            const AgriSectionLabel('Discover Cooperatives'),
            const SizedBox(height: 12),
            _coopCard('Rift Valley Dairy Farmers', '890 members', 'Open', false),
            const SizedBox(height: 12),
            _coopCard('Coast Horticulture Union', '560 members', 'Open', false),
            const SizedBox(height: 12),
            _coopCard('Western Kenya Sugarcane Growers', '2,100 members', 'Open', false),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _coopCard(String name, String members, String status, bool joined) {
    return AgriCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.groups_rounded, color: AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(members, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: joined
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : Colors.blue.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              joined ? 'Joined' : 'Join',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: joined ? AppTheme.primary : Colors.blue,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
