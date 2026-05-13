import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerDashboardScreen extends StatelessWidget {
  const BuyerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Buyer Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back, Buyer 🏪', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text('Your procurement overview', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 24),

            // KPI Cards
            Row(
              children: [
                Expanded(child: _kpiCard('Active Orders', '12', Icons.shopping_cart_rounded, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _kpiCard('Pending Bids', '5', Icons.gavel_rounded, Colors.orange)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _kpiCard('Suppliers', '28', Icons.people_rounded, Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _kpiCard('Spend (MTD)', 'KES 1.2M', Icons.account_balance_wallet_rounded, Colors.purple)),
              ],
            ),
            const SizedBox(height: 24),

            // Alerts Panel
            const AgriSectionLabel('Alerts'),
            const SizedBox(height: 12),
            AgriCard(
              borderColor: Colors.orange.withValues(alpha: 0.3),
              child: Column(
                children: [
                  _alertRow('⚠️', 'Maize prices up 5% — consider locking in contracts'),
                  const SizedBox(height: 8),
                  _alertRow('📦', '3 shipments arriving today'),
                  const SizedBox(height: 8),
                  _alertRow('🔔', '2 bids expiring in 24 hours'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Recommended Lots
            const AgriSectionLabel('Recommended Lots'),
            const SizedBox(height: 12),
            _lotCard('Premium Maize', 'Kiambu Cooperative', '500 bags', 'KES 3,100/bag'),
            const SizedBox(height: 12),
            _lotCard('Grade A Beans', 'Nakuru Farmers', '200 bags', 'KES 8,200/bag'),
            const SizedBox(height: 12),
            _lotCard('Fresh Tomatoes', 'Kajiado Growers', '100 crates', 'KES 4,500/crate'),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return AgriCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  static Widget _alertRow(String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
      ],
    );
  }

  static Widget _lotCard(String name, String supplier, String quantity, String price) {
    return AgriCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.buyerColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.inventory_2_rounded, color: AppTheme.buyerColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text('$supplier • $quantity', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Text(price, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.buyerColor)),
        ],
      ),
    );
  }
}
