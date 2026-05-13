import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerTradeScreen extends StatelessWidget {
  const BuyerTradeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Trade & Exchange'),
          leading: IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
          bottom: const TabBar(
            labelColor: AppTheme.buyerColor,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorColor: AppTheme.buyerColor,
            tabs: [
              Tab(text: 'Bids'),
              Tab(text: 'Contracts'),
              Tab(text: 'Wallet'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Bids Tab
            ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _bidCard('Maize Lot #234', 'KES 3,100/bag', 'Active', '2 days left'),
                const SizedBox(height: 12),
                _bidCard('Beans Lot #189', 'KES 8,500/bag', 'Won', 'Awaiting delivery'),
                const SizedBox(height: 12),
                _bidCard('Tomatoes Lot #312', 'KES 4,800/crate', 'Outbid', 'Ended'),
              ],
            ),
            // Contracts Tab
            _placeholderContent(Icons.description_rounded, 'Contracts', 'Manage your trade contracts and agreements'),
            // Wallet Tab
            _placeholderContent(Icons.account_balance_wallet_rounded, 'Wallet', 'View balance, transactions, and payments'),
          ],
        ),
      ),
    );
  }

  static Widget _bidCard(String lot, String price, String status, String detail) {
    final color = status == 'Active' ? Colors.green : status == 'Won' ? Colors.blue : Colors.red;
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(lot, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.buyerColor)),
              const Spacer(),
              Text(detail, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _placeholderContent(IconData icon, String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppTheme.buyerColor.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(fontSize: 14, color: AppTheme.textMuted)),
          const SizedBox(height: 24),
          const Text('Coming Soon', style: TextStyle(color: AppTheme.buyerColor, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
