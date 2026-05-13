import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'buyer_dashboard_screen.dart';
import 'buyer_marketplace_screen.dart';
import 'buyer_trade_screen.dart';
import 'buyer_logistics_screen.dart';
import 'buyer_profile_screen.dart';
import 'buyer_billing_screen.dart';
import 'buyer_analytics_screen.dart';
import 'buyer_reports_screen.dart';
import 'buyer_demand_screen.dart';
import 'buyer_suppliers_screen.dart';
import 'buyer_orders_screen.dart';
import 'buyer_quality_screen.dart';
import 'buyer_financial_screen.dart';
import 'buyer_market_intel_screen.dart';
import 'buyer_collaboration_screen.dart';

class BuyerShell extends StatefulWidget {
  const BuyerShell({super.key});

  static const routeName = '/buyer';

  @override
  State<BuyerShell> createState() => _BuyerShellState();
}

class _BuyerShellState extends State<BuyerShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    BuyerDashboardScreen(),
    BuyerMarketplaceScreen(),
    BuyerTradeScreen(),
    BuyerLogisticsScreen(),
    BuyerProfileScreen(),
  ];

  void _navigateToScreen(Widget screen) {
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      drawer: _buildDrawer(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(color: AppTheme.border, width: 1),
        ),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppTheme.surface,
        selectedItemColor: AppTheme.buyerColor,
        unselectedItemColor: AppTheme.textMuted,
        selectedFontSize: 12,
        unselectedFontSize: 11,
        elevation: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.store_rounded),
            label: 'Marketplace',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.swap_horiz_rounded),
            label: 'Trade',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.local_shipping_rounded),
            label: 'Logistics',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_rounded),
            label: 'More',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: AppTheme.surface,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Image.asset(
                    'assets/brand/agrismart_logo.png',
                    height: 48,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.buyerColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Buyer',
                      style: TextStyle(
                        color: AppTheme.buyerColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _drawerItem(Icons.dashboard_rounded, 'Dashboard', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 0);
                  }),
                  _drawerItem(Icons.store_rounded, 'Marketplace', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 1);
                  }),
                  _drawerItem(Icons.swap_horiz_rounded, 'Trade & Exchange', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 2);
                  }),
                  _drawerItem(Icons.person_rounded, 'Profile', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 4);
                  }),
                  _drawerItem(Icons.receipt_long_rounded, 'Billing', () {
                    _navigateToScreen(const BuyerBillingScreen());
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.analytics_rounded, 'Analytics', () {
                    _navigateToScreen(const BuyerAnalyticsScreen());
                  }),
                  _drawerItem(Icons.summarize_rounded, 'Reports', () {
                    _navigateToScreen(const BuyerReportsScreen());
                  }),
                  _drawerItem(Icons.inventory_rounded, 'Demand Planning', () {
                    _navigateToScreen(const BuyerDemandScreen());
                  }),
                  _drawerItem(Icons.local_shipping_rounded, 'Logistics', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 3);
                  }),
                  _drawerItem(Icons.people_rounded, 'Suppliers', () {
                    _navigateToScreen(const BuyerSuppliersScreen());
                  }),
                  _drawerItem(Icons.shopping_cart_rounded, 'Purchase Orders', () {
                    _navigateToScreen(const BuyerOrdersScreen());
                  }),
                  _drawerItem(Icons.verified_rounded, 'Quality', () {
                    _navigateToScreen(const BuyerQualityScreen());
                  }),
                  _drawerItem(Icons.account_balance_rounded, 'Financial', () {
                    _navigateToScreen(const BuyerFinancialScreen());
                  }),
                  _drawerItem(Icons.insights_rounded, 'Market Intelligence', () {
                    _navigateToScreen(const BuyerMarketIntelScreen());
                  }),
                  _drawerItem(Icons.forum_rounded, 'Collaboration', () {
                    _navigateToScreen(const BuyerCollaborationScreen());
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.settings_rounded, 'Settings', () {
                    Navigator.pop(context);
                  }),
                  _drawerItem(Icons.logout_rounded, 'Logout', () {
                    Navigator.of(context).pushNamedAndRemoveUntil(
                      '/role-selection',
                      (route) => false,
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.buyerColor, size: 22),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
      dense: true,
      onTap: onTap,
    );
  }
}
