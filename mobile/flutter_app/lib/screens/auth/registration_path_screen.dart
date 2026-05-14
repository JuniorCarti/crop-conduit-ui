import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import 'farmer/farmer_registration_screen.dart';
import 'buyer/buyer_registration_screen.dart';
import 'transport/transport_registration_screen.dart';

class RegistrationPathScreen extends StatelessWidget {
  const RegistrationPathScreen({super.key});

  static const routeName = '/registration';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 24),

              // ── Back + Logo ───────────────────────────────────
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                    style: IconButton.styleFrom(
                      backgroundColor: AppTheme.surface,
                      side: const BorderSide(color: AppTheme.border),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Image.asset(
                    'assets/brand/agrismart_logo.png',
                    height: 40,
                    fit: BoxFit.contain,
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // ── Heading ───────────────────────────────────────
              Text(
                'Choose your\nregistration path.',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Pick the account type that matches your role so we can tailor your experience.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppTheme.textMuted,
                ),
              ),

              const SizedBox(height: 32),

              // ── Role cards ────────────────────────────────────
              _RoleCard(
                icon: Icons.agriculture_rounded,
                title: 'Farmer Registration',
                description:
                    'For growers who need climate, crop, and harvest guidance.',
                color: AppTheme.farmerColor,
                onTap: () => Navigator.of(context).pushNamed(
                  FarmerRegistrationScreen.routeName,
                ),
              ),

              const SizedBox(height: 14),

              _RoleCard(
                icon: Icons.store_rounded,
                title: 'Buyer Registration',
                description:
                    'For traders, retailers, and offtakers sourcing produce.',
                color: AppTheme.buyerColor,
                onTap: () => Navigator.of(context).pushNamed(
                  BuyerRegistrationScreen.routeName,
                ),
              ),

              const SizedBox(height: 14),

              _RoleCard(
                icon: Icons.local_shipping_rounded,
                title: 'Transport & Logistics',
                description:
                    'For logistics companies managing fleets, drivers, and deliveries.',
                color: AppTheme.driverColor,
                onTap: () => Navigator.of(context).pushNamed(
                  TransportRegistrationScreen.routeName,
                ),
              ),

              const SizedBox(height: 32),

              // ── Already have account ──────────────────────────
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already registered? ',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Sign In',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  const _RoleCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 10,
                offset: Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 26),
              ),

              const SizedBox(width: 16),

              // Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textMuted,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 12),

              // Arrow
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: color.withValues(alpha: 0.7),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
