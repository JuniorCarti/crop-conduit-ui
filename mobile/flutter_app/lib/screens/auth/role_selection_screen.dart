import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';
import '../farmer/farmer_shell.dart';
import '../buyer/buyer_shell.dart';
import '../transport/transport_shell.dart';

class RoleSelectionScreen extends StatelessWidget {
  const RoleSelectionScreen({super.key});

  static const routeName = '/role-selection';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/brand/agrismart_logo.png',
                height: 80,
              ),
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  '⚙️ Dev Mode',
                  style: TextStyle(
                    color: Colors.orange,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Quick Access',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Select a role to explore the dashboard',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 40),
              AgriPrimaryButton(
                label: 'Continue as Farmer',
                icon: Icons.grass_rounded,
                color: AppTheme.farmerColor,
                onPressed: () {
                  Navigator.pushReplacementNamed(context, FarmerShell.routeName);
                },
              ),
              const SizedBox(height: 16),
              AgriPrimaryButton(
                label: 'Continue as Buyer',
                icon: Icons.store_rounded,
                color: AppTheme.buyerColor,
                onPressed: () {
                  Navigator.pushReplacementNamed(context, BuyerShell.routeName);
                },
              ),
              const SizedBox(height: 16),
              AgriPrimaryButton(
                label: 'Continue as Transporter',
                icon: Icons.local_shipping_rounded,
                color: AppTheme.driverColor,
                onPressed: () {
                  Navigator.pushReplacementNamed(context, TransportShell.routeName);
                },
              ),
              const SizedBox(height: 32),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text('← Back to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
