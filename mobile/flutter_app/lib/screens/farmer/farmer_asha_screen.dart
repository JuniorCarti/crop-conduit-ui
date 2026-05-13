import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class FarmerAshaScreen extends StatelessWidget {
  const FarmerAshaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Asha Voice Assistant'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      body: Column(
        children: [
          // Chat area
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              children: [
                _assistantBubble(
                  'Habari! I\'m Asha, your AI farming assistant. Ask me anything about your crops, weather, or market prices. 🌾',
                ),
                const SizedBox(height: 16),
                _userBubble('What\'s the best time to plant maize?'),
                const SizedBox(height: 16),
                _assistantBubble(
                  'Based on your location in Nairobi County, the optimal planting window for maize is mid-March to early April, coinciding with the long rains. Soil temperature should be above 18°C.',
                ),
                const SizedBox(height: 16),
                _suggestionsRow(),
              ],
            ),
          ),

          // Input area
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppTheme.surface,
              border: Border(
                top: BorderSide(color: AppTheme.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Text(
                      'Ask Asha anything...',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.mic_rounded, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _assistantBubble(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppTheme.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.record_voice_over_rounded,
            color: AppTheme.primary,
            size: 16,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, height: 1.4),
            ),
          ),
        ),
      ],
    );
  }

  static Widget _userBubble(String text) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          constraints: const BoxConstraints(maxWidth: 260),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.primary,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            text,
            style: const TextStyle(fontSize: 14, color: Colors.white, height: 1.4),
          ),
        ),
      ],
    );
  }

  static Widget _suggestionsRow() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _suggestionChip('Weather today?'),
        _suggestionChip('Market prices'),
        _suggestionChip('Pest control tips'),
        _suggestionChip('Irrigation advice'),
      ],
    );
  }

  static Widget _suggestionChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          color: AppTheme.primary,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
