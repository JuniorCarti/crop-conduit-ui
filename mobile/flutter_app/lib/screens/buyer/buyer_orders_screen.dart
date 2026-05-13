import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerOrdersScreen extends StatelessWidget {
  const BuyerOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Purchase Orders')),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _orderCard('PO-2025-001', 'Kiambu Cooperative', 'KES 155,000', 'Delivered', Colors.green),
          const SizedBox(height: 12),
          _orderCard('PO-2025-002', 'Nakuru Farmers', 'KES 82,000', 'In Transit', Colors.blue),
          const SizedBox(height: 12),
          _orderCard('PO-2025-003', 'Kajiado Growers', 'KES 45,000', 'Processing', Colors.orange),
          const SizedBox(height: 12),
          _orderCard('PO-2025-004', 'Meru Coffee', 'KES 230,000', 'Pending', Colors.grey),
          const SizedBox(height: 24),
          AgriCard(
            child: Column(
              children: [
                const Icon(Icons.shopping_cart_rounded, size: 48, color: AppTheme.buyerColor),
                const SizedBox(height: 12),
                const Text('Order management features coming soon', style: TextStyle(fontSize: 14, color: AppTheme.textMuted), textAlign: TextAlign.center),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _orderCard(String id, String supplier, String amount, String status, Color statusColor) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(id, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              const Spacer(),
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
          const SizedBox(height: 6),
          Text(supplier, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 4),
          Text(amount, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.buyerColor)),
        ],
      ),
    );
  }
}
