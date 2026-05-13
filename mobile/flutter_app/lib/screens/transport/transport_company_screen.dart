import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportCompanyScreen extends StatelessWidget {
  const TransportCompanyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Company Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.driverColor.withValues(alpha: 0.1),
              child: const Icon(Icons.local_shipping_rounded, size: 48, color: AppTheme.driverColor),
            ),
            const SizedBox(height: 16),
            const Text('SwiftHaul Logistics', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            const Text('Nairobi, Kenya', style: TextStyle(fontSize: 14, color: AppTheme.textMuted)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.driverColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('Transport', style: TextStyle(color: AppTheme.driverColor, fontWeight: FontWeight.w600, fontSize: 12)),
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                _statCard('Fleet', '8 vehicles'),
                const SizedBox(width: 12),
                _statCard('Drivers', '6 active'),
                const SizedBox(width: 12),
                _statCard('Rating', '4.7 ★'),
              ],
            ),
            const SizedBox(height: 24),

            AgriCard(
              child: Column(
                children: [
                  _profileRow(Icons.business_rounded, 'Company', 'SwiftHaul Logistics Ltd'),
                  const Divider(height: 20),
                  _profileRow(Icons.phone_rounded, 'Phone', '+254 733 456 789'),
                  const Divider(height: 20),
                  _profileRow(Icons.email_rounded, 'Email', 'ops@swifthaul.co.ke'),
                  const Divider(height: 20),
                  _profileRow(Icons.location_on_rounded, 'Base', 'Industrial Area, Nairobi'),
                  const Divider(height: 20),
                  _profileRow(Icons.calendar_today_rounded, 'Joined', 'February 2024'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AgriPrimaryButton(
              label: 'Edit Company Profile',
              icon: Icons.edit_rounded,
              color: AppTheme.driverColor,
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
            Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.driverColor)),
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
        Icon(icon, size: 18, color: AppTheme.driverColor),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        const Spacer(),
        Flexible(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), textAlign: TextAlign.right)),
      ],
    );
  }
}
