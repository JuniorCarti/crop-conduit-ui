import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerProfileScreen extends StatelessWidget {
  const BuyerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.buyerColor.withValues(alpha: 0.1),
              child: const Icon(Icons.business_rounded, size: 48, color: AppTheme.buyerColor),
            ),
            const SizedBox(height: 16),
            const Text('KenyaMart Ltd', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('Nairobi, Kenya', style: TextStyle(fontSize: 14, color: AppTheme.textMuted)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.buyerColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Buyer', style: TextStyle(color: AppTheme.buyerColor, fontWeight: FontWeight.w600, fontSize: 12)),
            ),
            const SizedBox(height: 24),
            AgriCard(
              child: Column(
                children: [
                  _profileRow(Icons.business_rounded, 'Company', 'KenyaMart Ltd'),
                  const Divider(height: 20),
                  _profileRow(Icons.phone_rounded, 'Phone', '+254 720 123 456'),
                  const Divider(height: 20),
                  _profileRow(Icons.email_rounded, 'Email', 'procurement@kenyamart.co.ke'),
                  const Divider(height: 20),
                  _profileRow(Icons.location_on_rounded, 'Location', 'Nairobi CBD'),
                  const Divider(height: 20),
                  _profileRow(Icons.calendar_today_rounded, 'Joined', 'January 2024'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AgriPrimaryButton(
              label: 'Edit Profile',
              icon: Icons.edit_rounded,
              color: AppTheme.buyerColor,
              onPressed: () {},
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _profileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.buyerColor),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        const Spacer(),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
