import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class BuyerCollaborationScreen extends StatelessWidget {
  const BuyerCollaborationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Collaboration')),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.forum_rounded, size: 72, color: AppTheme.buyerColor.withValues(alpha: 0.3)),
            const SizedBox(height: 24),
            const Text('Team Collaboration', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Communicate with your team, share updates, and coordinate procurement activities in real-time.',
              style: TextStyle(fontSize: 14, color: AppTheme.textMuted, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            AgriCard(
              child: Column(
                children: [
                  _featureRow(Icons.chat_rounded, 'Team Chat'),
                  const Divider(height: 16),
                  _featureRow(Icons.task_alt_rounded, 'Task Management'),
                  const Divider(height: 16),
                  _featureRow(Icons.share_rounded, 'Document Sharing'),
                  const Divider(height: 16),
                  _featureRow(Icons.video_call_rounded, 'Video Calls'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Coming Soon', style: TextStyle(color: AppTheme.buyerColor, fontWeight: FontWeight.w600, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  static Widget _featureRow(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.buyerColor),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
