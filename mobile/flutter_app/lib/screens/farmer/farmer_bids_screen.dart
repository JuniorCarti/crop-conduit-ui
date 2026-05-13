import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerBidsScreen extends StatelessWidget {
  const FarmerBidsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bids & Results')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AgriSectionLabel('Active Bids'),
            const SizedBox(height: 12),
            _bidCard('Maize - 50 bags', 'KES 3,200/bag', 'Pending', '3 bidders', Colors.orange),
            const SizedBox(height: 12),
            _bidCard('Tomatoes - 30 crates', 'KES 5,000/crate', 'Active', '7 bidders', Colors.green),
            const SizedBox(height: 24),
            const AgriSectionLabel('Completed'),
            const SizedBox(height: 12),
            _bidCard('Beans - 20 bags', 'KES 8,800/bag', 'Won', 'Sold to KenyaMart', Colors.blue),
            const SizedBox(height: 12),
            _bidCard('Potatoes - 100 bags', 'KES 2,600/bag', 'Expired', 'No bids received', Colors.grey),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _bidCard(String item, String price, String status, String detail, Color statusColor) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(item, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  status,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.primary)),
              const Spacer(),
              Text(detail, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}
