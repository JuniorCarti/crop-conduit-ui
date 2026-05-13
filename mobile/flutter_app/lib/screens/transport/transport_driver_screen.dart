import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class TransportDriverScreen extends StatelessWidget {
  const TransportDriverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Updates'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          _driverCard('James Mwangi', 'KBZ 123A', 'On Route', 'Kiambu → Nairobi'),
          const SizedBox(height: 12),
          _driverCard('Peter Ochieng', 'KCA 456B', 'Loading', 'Nakuru Depot'),
          const SizedBox(height: 12),
          _driverCard('David Kiprop', 'KDA 789C', 'Available', 'Nairobi Base'),
          const SizedBox(height: 12),
          _driverCard('Samuel Wafula', 'KBB 321D', 'On Route', 'Eldoret → Nairobi'),
          const SizedBox(height: 12),
          _driverCard('Joseph Mutua', 'KDF 987F', 'Off Duty', 'Rest Period'),
        ],
      ),
    );
  }

  static Widget _driverCard(String name, String vehicle, String status, String location) {
    final color = switch (status) {
      'On Route' => Colors.blue,
      'Loading' => Colors.orange,
      'Available' => Colors.green,
      _ => Colors.grey,
    };
    return AgriCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppTheme.driverColor.withValues(alpha: 0.1),
            child: Text(name[0], style: const TextStyle(color: AppTheme.driverColor, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                Text('$vehicle • $location', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(status, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ),
        ],
      ),
    );
  }
}
