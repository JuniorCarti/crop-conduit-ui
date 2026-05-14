import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/floating_bottom_nav.dart';
import 'farmer_dashboard_screen.dart';
import 'farmer_market_screen.dart';
import 'farmer_climate_screen.dart';
import 'farmer_harvest_screen.dart';
import 'farmer_asha_screen.dart';
import 'farmer_community_screen.dart';
import 'farmer_marketplace_screen.dart';
import 'farmer_transport_screen.dart';
import 'farmer_cooperatives_screen.dart';
import 'farmer_bids_screen.dart';
import 'farmer_crops_screen.dart';
import 'farmer_resources_screen.dart';
import 'farmer_irrigation_screen.dart';
import 'farmer_finance_screen.dart';
import 'farmer_profile_screen.dart';

class FarmerShell extends StatefulWidget {
  const FarmerShell({super.key});

  static const routeName = '/farmer';

  @override
  State<FarmerShell> createState() => _FarmerShellState();
}

class _FarmerShellState extends State<FarmerShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    FarmerDashboardScreen(),
    FarmerMarketScreen(),
    FarmerClimateScreen(),
    FarmerHarvestScreen(),
    FarmerAshaScreen(),
  ];

  void _navigateToScreen(Widget screen) {
    Navigator.pop(context); // close drawer
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
    return FloatingBottomNav(
      currentIndex: _currentIndex,
      onTap: (index) => setState(() => _currentIndex = index),
      activeColor: AppTheme.farmerColor,
      items: const [
        FloatingNavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded),
        FloatingNavItem(icon: Icons.trending_up_outlined, activeIcon: Icons.trending_up_rounded),
        FloatingNavItem(icon: Icons.cloud_outlined, activeIcon: Icons.cloud_rounded),
        FloatingNavItem(icon: Icons.grass_outlined, activeIcon: Icons.grass_rounded),
        FloatingNavItem(icon: Icons.menu_rounded, activeIcon: Icons.menu_rounded),
      ],
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
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.farmerColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Farmer',
                      style: TextStyle(
                        color: AppTheme.farmerColor,
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
                  _drawerItem(Icons.trending_up_rounded, 'Market Oracle', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 1);
                  }),
                  _drawerItem(Icons.cloud_rounded, 'Climate & Weather', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 2);
                  }),
                  _drawerItem(Icons.record_voice_over_rounded, 'Asha Voice Assistant', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 4);
                  }),
                  _drawerItem(Icons.grass_rounded, 'Harvest Planner', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 3);
                  }),
                  _drawerItem(Icons.people_rounded, 'Community', () {
                    _navigateToScreen(const FarmerCommunityScreen());
                  }),
                  _drawerItem(Icons.storefront_rounded, 'Marketplace', () {
                    _navigateToScreen(const FarmerMarketplaceScreen());
                  }),
                  _drawerItem(Icons.local_shipping_rounded, 'Transport Booking', () {
                    _navigateToScreen(const FarmerTransportScreen());
                  }),
                  _drawerItem(Icons.groups_rounded, 'Cooperatives', () {
                    _navigateToScreen(const FarmerCooperativesScreen());
                  }),
                  _drawerItem(Icons.gavel_rounded, 'Bids & Results', () {
                    _navigateToScreen(const FarmerBidsScreen());
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.eco_rounded, 'Crops', () {
                    _navigateToScreen(const FarmerCropsScreen());
                  }, premium: true),
                  _drawerItem(Icons.inventory_rounded, 'Resources', () {
                    _navigateToScreen(const FarmerResourcesScreen());
                  }, premium: true),
                  _drawerItem(Icons.water_drop_rounded, 'Irrigation', () {
                    _navigateToScreen(const FarmerIrrigationScreen());
                  }, premium: true),
                  _drawerItem(Icons.account_balance_wallet_rounded, 'Finance', () {
                    _navigateToScreen(const FarmerFinanceScreen());
                  }, premium: true),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.person_rounded, 'Profile', () {
                    _navigateToScreen(const FarmerProfileScreen());
                  }),
                  _drawerItem(Icons.settings_rounded, 'Settings', () {
                    Navigator.pop(context);
                  }),
                  _drawerItem(Icons.logout_rounded, 'Logout', () {
                    Navigator.of(context).pushNamedAndRemoveUntil(
                      '/login',
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

  Widget _drawerItem(IconData icon, String title, VoidCallback onTap,
      {bool premium = false}) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primary, size: 22),
      title: Row(
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.textPrimary,
            ),
          ),
          if (premium) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'Premium',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: Colors.amber,
                ),
              ),
            ),
          ],
        ],
      ),
      dense: true,
      onTap: onTap,
    );
  }
}
