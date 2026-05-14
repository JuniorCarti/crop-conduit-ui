import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerDashboardScreen extends StatelessWidget {
  const FarmerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroCard(),
            const SizedBox(height: 20),
            _buildFieldPulseCard(),
            const SizedBox(height: 20),
            _buildMetricsRow(),
            const SizedBox(height: 20),
            _buildQuickActions(),
            const SizedBox(height: 20),
            _buildFarmHealthOverview(),
            const SizedBox(height: 20),
            _buildUpcomingEvents(),
            const SizedBox(height: 20),
            _buildMarketIncomeSnapshot(),
            const SizedBox(height: 20),
            _buildExecutionChecklist(),
            const SizedBox(height: 20),
            _buildUnlockMoreTools(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ─── 1. Hero Card: Cooperative Field Command ───────────────────────────────
  Widget _buildHeroCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE8F5E9), Color(0xFFC8E6C9)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA5D6A7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'COOPERATIVE FIELD COMMAND',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: AppTheme.textMuted.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Faith Cabbage Farm',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Row(
            children: [
              Text('📍 ', style: TextStyle(fontSize: 13)),
              Text(
                'Bomet / Kipreres',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _badge('Priority: Low', const Color(0xFF1B5E20)),
              _badge('Risk Items: 0', const Color(0xFF1B5E20)),
              _badge('Alerts: 0', const Color(0xFF1B5E20)),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _cropTag('Maize'),
              _cropTag('Beans'),
              _cropTag('Tomatoes'),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    "TODAY'S PRIORITY",
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFE65100),
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Onions prices are trending up.',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  '● Check market prices',
                  style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 3),
                const Text(
                  '● Review delivery plan',
                  style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: AgriPrimaryButton(
                  label: 'Review Climate',
                  onPressed: () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AgriSecondaryButton(
                  label: 'Open Market Prices',
                  onPressed: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── 2. Field Pulse ────────────────────────────────────────────────────────
  Widget _buildFieldPulseCard() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Field Pulse',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'Live farm conditions and profile state',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          _pulseRow('Weather', 'Stable today', const Color(0xFF1B5E20)),
          const SizedBox(height: 10),
          _pulseRow('Frost', 'Low', const Color(0xFF1B5E20)),
          const SizedBox(height: 10),
          _pulseRow('Water', 'No data', const Color(0xFF9E9E9E)),
          const SizedBox(height: 10),
          _pulseRow('Profile', 'Incomplete', const Color(0xFFE65100)),
          const SizedBox(height: 14),
          Row(
            children: [
              Text(
                'Open Alerts Center →',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── 3. Metrics Row ────────────────────────────────────────────────────────
  Widget _buildMetricsRow() {
    return SizedBox(
      height: 100,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _metricCard(
            'PROFILE',
            'Setup',
            Icons.shield_outlined,
            const Color(0xFFFFEBEE),
            const Color(0xFFC62828),
          ),
          const SizedBox(width: 12),
          _metricCard(
            'SOIL MOISTURE',
            '--',
            Icons.water_drop_outlined,
            const Color(0xFFE3F2FD),
            const Color(0xFF1565C0),
          ),
          const SizedBox(width: 12),
          _metricCard(
            'REVENUE (6M)',
            'No sales',
            Icons.bar_chart_rounded,
            const Color(0xFFF3E5F5),
            const Color(0xFF6A1B9A),
          ),
          const SizedBox(width: 12),
          _metricCard(
            'NEXT HARVEST',
            'Not scheduled',
            Icons.calendar_today_rounded,
            const Color(0xFFFFF8E1),
            const Color(0xFFF57F17),
          ),
        ],
      ),
    );
  }

  // ─── 4. Quick Actions ──────────────────────────────────────────────────────
  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AgriSectionLabel('Quick Actions'),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 2.2,
          children: [
            _quickActionCard(
              Icons.cloud_rounded,
              'Climate Insights',
              const Color(0xFF00897B),
            ),
            _quickActionCard(
              Icons.trending_up_rounded,
              'Market Prices',
              const Color(0xFF2E7D32),
            ),
            _quickActionCard(
              Icons.calendar_month_rounded,
              'Harvest Planner',
              const Color(0xFF37474F),
            ),
            _quickActionCard(
              Icons.mic_rounded,
              'Talk to Asha',
              const Color(0xFFE65100),
            ),
          ],
        ),
      ],
    );
  }

  // ─── 5. Farm Health Overview ───────────────────────────────────────────────
  Widget _buildFarmHealthOverview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const AgriSectionLabel('Farm Health Overview'),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.1,
          children: [
            _healthCard(
              Icons.eco_rounded,
              'Crop Health',
              'Unknown',
              'Add crop data to see health.',
              const Color(0xFF9E9E9E),
            ),
            _healthCard(
              Icons.water_drop_rounded,
              'Soil Moisture',
              'No data',
              'Connect soil data sources.',
              const Color(0xFF9E9E9E),
            ),
            _healthCard(
              Icons.grain_rounded,
              'Rain Outlook',
              'Low',
              'No rain alerts.',
              const Color(0xFF2E7D32),
            ),
            _healthCard(
              Icons.bug_report_rounded,
              'Disease Risk',
              'Low',
              'Low disease pressure.',
              const Color(0xFF2E7D32),
            ),
          ],
        ),
      ],
    );
  }

  // ─── 6. Upcoming Events ────────────────────────────────────────────────────
  Widget _buildUpcomingEvents() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Upcoming events',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                'View schedule',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _eventRow(
            Icons.circle,
            'Spray window',
            'May 15',
            AppTheme.primaryLight,
          ),
          const SizedBox(height: 12),
          _eventRow(
            Icons.trending_up_rounded,
            'Best market delivery day',
            'May 17',
            AppTheme.primaryLight,
          ),
        ],
      ),
    );
  }

  // ─── 7. Market and Income Snapshot ─────────────────────────────────────────
  Widget _buildMarketIncomeSnapshot() {
    return Row(
      children: [
        Expanded(
          child: AgriCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Best price today',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Ksh 200 / per kg',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Onions +0% today',
                  style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: AgriCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Revenue trend (6 months)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Start selling to see revenue trends.',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppTheme.textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── 8. Execution Checklist ────────────────────────────────────────────────
  Widget _buildExecutionChecklist() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Execution checklist',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Market opportunity',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 14),
          const Text(
            '● Check market prices',
            style: TextStyle(fontSize: 13, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 6),
          const Text(
            '● Review delivery plan',
            style: TextStyle(fontSize: 13, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 16),
          AgriPrimaryButton(
            label: 'Open Climate Insights',
            onPressed: () {},
            icon: Icons.cloud_rounded,
          ),
        ],
      ),
    );
  }

  // ─── 9. Unlock More Tools ──────────────────────────────────────────────────
  Widget _buildUnlockMoreTools() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '🔒 Unlock more tools',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        _premiumToolCard(
          'Sentinel Agent',
          'Monitors crop health signals and suggests actions for pests, disease risks, and growth progress.',
        ),
        const SizedBox(height: 12),
        _premiumToolCard(
          'Quartermaster',
          'Track farm inputs, tools, and usage so you never run out of essentials at critical times.',
        ),
        const SizedBox(height: 12),
        _premiumToolCard(
          'Scheduler',
          'Build watering routines based on weather and crop stage to reduce waste and boost yield.',
        ),
      ],
    );
  }

  // ─── Helper Widgets ────────────────────────────────────────────────────────

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _cropTag(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.border),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: AppTheme.textPrimary,
        ),
      ),
    );
  }

  Widget _pulseRow(String label, String value, Color badgeColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppTheme.textPrimary,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: badgeColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: badgeColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _metricCard(
    String title,
    String value,
    IconData icon,
    Color bgColor,
    Color iconColor,
  ) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: iconColor),
          ),
          const Spacer(),
          Text(
            title,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickActionCard(IconData icon, String label, Color color) {
    return AgriCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Go to',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _healthCard(
    IconData icon,
    String title,
    String status,
    String description,
    Color statusColor,
  ) {
    return AgriCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 22, color: AppTheme.primary),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: statusColor,
              ),
            ),
          ),
          const Spacer(),
          Text(
            description,
            style: const TextStyle(
              fontSize: 11,
              color: AppTheme.textMuted,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _eventRow(IconData icon, String title, String date, Color color) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        Text(
          date,
          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
        ),
      ],
    );
  }

  Widget _premiumToolCard(String title, String description) {
    return AgriCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.lock_outline, size: 16, color: AppTheme.textMuted),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Learn more',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}
