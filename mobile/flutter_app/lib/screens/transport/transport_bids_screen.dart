import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportBidsScreen extends StatelessWidget {
  const TransportBidsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Incoming Bids'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _bidCard(
            'Kiambu → Nairobi',
            'Maize - 3 tonnes',
            'KES 12,000',
            'Tomorrow 7:00 AM',
            true,
          ),
          const SizedBox(height: 12),
          _bidCard(
            'Nakuru → Kisumu',
            'Beans - 5 tonnes',
            'KES 28,000',
            'Jun 18, 6:00 AM',
            true,
          ),
          const SizedBox(height: 12),
          _bidCard(
            'Nairobi → Mombasa',
            'Mixed produce - 8 tonnes',
            'KES 55,000',
            'Jun 20, 5:00 AM',
            true,
          ),
          const SizedBox(height: 12),
          _bidCard(
            'Eldoret → Nairobi',
            'Wheat - 10 tonnes',
            'KES 45,000',
            'Jun 15 (Expired)',
            false,
          ),
        ],
      ),
    );
  }

  static Widget _bidCard(String route, String cargo, String price, String date, bool active) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.route_rounded, size: 16, color: AppTheme.driverColor),
              const SizedBox(width: 8),
              Expanded(child: Text(route, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
              Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.driverColor)),
            ],
          ),
          const SizedBox(height: 6),
          Text(cargo, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          const SizedBox(height: 4),
          Text(date, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          if (active) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.driverColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Accept', style: TextStyle(fontSize: 12, color: Colors.white)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Reject', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
