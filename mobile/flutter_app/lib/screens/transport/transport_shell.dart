import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'transport_portal_screen.dart';
import 'transport_fleet_screen.dart';
import 'transport_shipments_screen.dart';
import 'transport_bids_screen.dart';
import 'transport_driver_screen.dart';
import 'transport_tracking_screen.dart';
import 'transport_cold_chain_screen.dart';
import 'transport_pooling_screen.dart';
import 'transport_warehouse_screen.dart';
import 'transport_lastmile_screen.dart';
import 'transport_company_screen.dart';

class TransportShell extends StatefulWidget {
  const TransportShell({super.key});

  static const routeName = '/transport';

  @override
  State<TransportShell> createState() => _TransportShellState();
}

class _TransportShellState extends State<TransportShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    TransportPortalScreen(),
    TransportFleetScreen(),
    TransportShipmentsScreen(),
    TransportBidsScreen(),
    TransportDriverScreen(),
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
        selectedItemColor: AppTheme.driverColor,
        unselectedItemColor: AppTheme.textMuted,
        selectedFontSize: 12,
        unselectedFontSize: 11,
        elevation: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Portal',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car_rounded),
            label: 'Fleet',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_rounded),
            label: 'Shipments',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.gavel_rounded),
            label: 'Bids',
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
                      color: AppTheme.driverColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Transport',
                      style: TextStyle(
                        color: AppTheme.driverColor,
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
                  _drawerItem(Icons.dashboard_rounded, 'Transport Portal', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 0);
                  }),
                  _drawerItem(Icons.directions_car_rounded, 'Fleet Management', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 1);
                  }),
                  _drawerItem(Icons.inventory_2_rounded, 'Active Shipments', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 2);
                  }),
                  _drawerItem(Icons.gavel_rounded, 'Incoming Bids', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 3);
                  }),
                  _drawerItem(Icons.person_pin_rounded, 'Driver Updates', () {
                    Navigator.pop(context);
                    setState(() => _currentIndex = 4);
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.gps_fixed_rounded, 'Fleet Tracking', () {
                    _navigateToScreen(const TransportTrackingScreen());
                  }),
                  _drawerItem(Icons.ac_unit_rounded, 'Cold Chain Monitoring', () {
                    _navigateToScreen(const TransportColdChainScreen());
                  }),
                  _drawerItem(Icons.group_work_rounded, 'Shared Pooling', () {
                    _navigateToScreen(const TransportPoolingScreen());
                  }),
                  _drawerItem(Icons.warehouse_rounded, 'Warehouse Management', () {
                    _navigateToScreen(const TransportWarehouseScreen());
                  }),
                  _drawerItem(Icons.route_rounded, 'Last-Mile Optimization', () {
                    _navigateToScreen(const TransportLastmileScreen());
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(),
                  ),
                  _drawerItem(Icons.business_rounded, 'Company Profile', () {
                    _navigateToScreen(const TransportCompanyScreen());
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

  Widget _drawerItem(IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.driverColor, size: 22),
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
