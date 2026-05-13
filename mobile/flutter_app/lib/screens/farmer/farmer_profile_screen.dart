import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerProfileScreen extends StatelessWidget {
  const FarmerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            // Avatar
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
              child: const Icon(Icons.person_rounded, size: 48, color: AppTheme.primary),
            ),
            const SizedBox(height: 16),
            const Text(
              'John Kamau',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              'Kiambu County, Kenya',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Farmer',
                style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
            const SizedBox(height: 24),

            // Stats
            Row(
              children: [
                _statCard('Farm Size', '6 acres'),
                const SizedBox(width: 12),
                _statCard('Crops', '4 active'),
                const SizedBox(width: 12),
                _statCard('Rating', '4.8 ★'),
              ],
            ),
            const SizedBox(height: 24),

            // Profile Details
            AgriCard(
              child: Column(
                children: [
                  _profileRow(Icons.phone_rounded, 'Phone', '+254 712 345 678'),
                  const Divider(height: 20),
                  _profileRow(Icons.email_rounded, 'Email', 'john@example.com'),
                  const Divider(height: 20),
                  _profileRow(Icons.location_on_rounded, 'Location', 'Kiambu, Kenya'),
                  const Divider(height: 20),
                  _profileRow(Icons.calendar_today_rounded, 'Joined', 'March 2024'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AgriPrimaryButton(
              label: 'Edit Profile',
              icon: Icons.edit_rounded,
              onPressed: () {},
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _statCard(String label, String value) {
    return Expanded(
      child: AgriCard(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(
          children: [
            Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.primary)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }

  static Widget _profileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        const Spacer(),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
