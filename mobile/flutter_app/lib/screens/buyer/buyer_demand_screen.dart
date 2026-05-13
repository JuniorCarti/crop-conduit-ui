import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerDemandScreen extends StatelessWidget {
  const BuyerDemandScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Demand Planning')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('Demand Forecast'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                children: [
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Text('📈 Demand forecast chart coming soon', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const AgriSectionLabel('Planned Purchases'),
            const SizedBox(height: 12),
            _planCard('Maize', 'Q3 2025', '1,000 bags'),
            const SizedBox(height: 8),
            _planCard('Beans', 'Q3 2025', '500 bags'),
            const SizedBox(height: 8),
            _planCard('Tomatoes', 'Weekly', '50 crates'),
          ],
        ),
      ),
    );
  }

  static Widget _planCard(String commodity, String period, String quantity) {
    return AgriCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          const Icon(Icons.inventory_rounded, size: 20, color: AppTheme.buyerColor),
          const SizedBox(width: 12),
          Expanded(child: Text(commodity, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(quantity, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(period, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
