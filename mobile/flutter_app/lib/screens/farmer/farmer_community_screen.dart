import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerCommunityScreen extends StatelessWidget {
  const FarmerCommunityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Community'),
          bottom: const TabBar(
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorColor: AppTheme.primary,
            tabs: [
              Tab(text: 'Feed'),
              Tab(text: 'Members'),
              Tab(text: 'Events'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Feed Tab
            ListView(
              padding: const EdgeInsets.all(24),
              children: [
                _postCard('John Kamau', 'Just harvested 3 tonnes of maize from my 2-acre plot! The new variety is amazing. 🌽', '2h ago'),
                const SizedBox(height: 12),
                _postCard('Mary Wanjiku', 'Anyone experiencing aphid problems on their beans this season? Looking for organic solutions.', '5h ago'),
                const SizedBox(height: 12),
                _postCard('AgriSmart Team', '📢 New market prices update available. Check the Market Oracle for latest commodity prices.', '1d ago'),
              ],
            ),
            // Members Tab
            _placeholderTab(Icons.people_rounded, 'Community Members', 'Connect with 2,400+ farmers in your region'),
            // Events Tab
            _placeholderTab(Icons.event_rounded, 'Upcoming Events', 'Farm visits, workshops, and market days'),
          ],
        ),
      ),
    );
  }

  static Widget _postCard(String author, String content, String time) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                child: Text(
                  author[0],
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  author,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
              Text(
                time,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            content,
            style: const TextStyle(fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.favorite_border_rounded, size: 18, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              const Text('12', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(width: 16),
              Icon(Icons.chat_bubble_outline_rounded, size: 18, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              const Text('5', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _placeholderTab(IconData icon, String title, String subtitle) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: AppTheme.primary.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 14, color: AppTheme.textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            const Text(
              'Coming Soon',
              style: TextStyle(
                fontSize: 13,
                color: AppTheme.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
