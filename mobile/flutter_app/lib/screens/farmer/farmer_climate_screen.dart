import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerClimateScreen extends StatelessWidget {
  const FarmerClimateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Climate & Weather'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Weather
            AgriCard(
              child: Row(
                children: [
                  const Icon(Icons.wb_sunny_rounded, color: Colors.orange, size: 48),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '24°C',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      Text(
                        'Partly Cloudy • Nairobi',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 7-Day Forecast
            const AgriSectionLabel('7-Day Forecast'),
            const SizedBox(height: 12),
            SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _forecastCard('Mon', Icons.wb_sunny_rounded, '26°', '18°', Colors.orange),
                  _forecastCard('Tue', Icons.cloud_rounded, '22°', '16°', Colors.grey),
                  _forecastCard('Wed', Icons.grain_rounded, '20°', '15°', Colors.blue),
                  _forecastCard('Thu', Icons.grain_rounded, '19°', '14°', Colors.blue),
                  _forecastCard('Fri', Icons.wb_cloudy_rounded, '23°', '17°', Colors.grey),
                  _forecastCard('Sat', Icons.wb_sunny_rounded, '25°', '18°', Colors.orange),
                  _forecastCard('Sun', Icons.wb_sunny_rounded, '27°', '19°', Colors.orange),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Rain Outlook
            const AgriSectionLabel('Rain Outlook'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.water_drop_rounded, color: Colors.blue, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        '60% chance of rain on Wednesday',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Expected rainfall: 12-18mm. Consider delaying fertilizer application.',
                    style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Frost Risk
            const AgriSectionLabel('Frost Risk'),
            const SizedBox(height: 12),
            AgriCard(
              borderColor: Colors.green.withValues(alpha: 0.3),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.ac_unit_rounded, color: Colors.green, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Low Risk',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        Text(
                          'No frost expected in the next 7 days',
                          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Advisory
            const AgriSectionLabel('Farm Advisory'),
            const SizedBox(height: 12),
            AgriCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _advisoryItem('💧', 'Reduce irrigation on Wednesday due to expected rain'),
                  const SizedBox(height: 10),
                  _advisoryItem('🌡️', 'Optimal temperature for maize growth this week'),
                  const SizedBox(height: 10),
                  _advisoryItem('🌬️', 'Light winds — good for spraying operations'),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  static Widget _forecastCard(
      String day, IconData icon, String high, String low, Color color) {
    return Container(
      width: 80,
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(day, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 6),
          Text(high, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
          Text(low, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  static Widget _advisoryItem(String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 16)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
          ),
        ),
      ],
    );
  }
}
