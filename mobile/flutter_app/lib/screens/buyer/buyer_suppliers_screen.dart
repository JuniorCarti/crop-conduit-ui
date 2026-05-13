import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerSuppliersScreen extends StatelessWidget {
  const BuyerSuppliersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Suppliers')),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _supplierCard('Kiambu Farmers Cooperative', 'Maize, Beans', 4.8, 'Verified'),
          const SizedBox(height: 12),
          _supplierCard('Nakuru Farmers Union', 'Wheat, Potatoes', 4.5, 'Verified'),
          const SizedBox(height: 12),
          _supplierCard('Kajiado Growers Association', 'Tomatoes, Onions', 4.9, 'Verified'),
          const SizedBox(height: 12),
          _supplierCard('Meru Coffee Farmers', 'Coffee', 4.7, 'Pending'),
          const SizedBox(height: 12),
          _supplierCard('Kisumu Fish Traders', 'Tilapia, Nile Perch', 4.2, 'Verified'),
        ],
      ),
    );
  }

  static Widget _supplierCard(String name, String products, double rating, String status) {
    return AgriCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppTheme.buyerColor.withValues(alpha: 0.1),
            child: Text(name[0], style: const TextStyle(color: AppTheme.buyerColor, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(products, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                  Text(' $rating', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 2),
              Text(status, style: TextStyle(fontSize: 10, color: status == 'Verified' ? Colors.green : Colors.orange)),
            ],
          ),
        ],
      ),
    );
  }
}
