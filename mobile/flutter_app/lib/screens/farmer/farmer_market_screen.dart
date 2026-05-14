import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';

class FarmerMarketScreen extends StatelessWidget {
  const FarmerMarketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Market Forecasting',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            Text(
              'Oracle Agent - Real-time prices',
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.sync_rounded, size: 16),
            label: const Text('Sync', style: TextStyle(fontSize: 12)),
          ),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.notifications_active_outlined, size: 16),
            label: const Text('Alert', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildMarketCommandCenter(),
            const SizedBox(height: 20),
            _buildOraclePulse(),
            const SizedBox(height: 20),
            _buildStatsRow(),
            const SizedBox(height: 20),
            _buildPredictionForm(),
            const SizedBox(height: 20),
            _buildPredictionResult(),
            const SizedBox(height: 20),
            _buildEconomicAdjustment(),
            const SizedBox(height: 20),
            _buildActiveSignals(),
            const SizedBox(height: 20),
            _buildAdjustmentMethodology(),
            const SizedBox(height: 20),
            _buildTodaysPrices(),
            const SizedBox(height: 20),
            _buildRecommendedMarkets(),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  // ─── 1. Market Command Center ──────────────────────────────────────────────
  Widget _buildMarketCommandCenter() {
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
            'MARKET COMMAND CENTER',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: AppTheme.textMuted.withValues(alpha: 0.8),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Market Oracle Prediction',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Predict prices for a specific market and crop',
            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 10),
          const Text(
            'Run a prediction to see results.',
            style: TextStyle(
              fontSize: 13,
              fontStyle: FontStyle.italic,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _badge('Best: Marikiti (Nairobi)', const Color(0xFF1B5E20)),
              _badge('Markets: 5', const Color(0xFF1565C0)),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: const Row(
              children: [
                Icon(Icons.search, size: 18, color: AppTheme.textMuted),
                SizedBox(width: 8),
                Text(
                  'Search crops...',
                  style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── 2. Oracle Pulse ───────────────────────────────────────────────────────
  Widget _buildOraclePulse() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Oracle pulse',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'Live prediction and feed readiness',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          _oracleRow('Prediction engine', 'Run a prediction to see results.'),
          const SizedBox(height: 10),
          _oracleRow('Selected date', '2026-05-14'),
          const SizedBox(height: 10),
          _oracleRow('Market focus', 'Wakulima (Nairobi)'),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: AgriPrimaryButton(
              label: 'Run prediction →',
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }

  // ─── 3. Stats Row ─────────────────────────────────────────────────────────
  Widget _buildStatsRow() {
    return SizedBox(
      height: 110,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _statCard('MARKETS TRACKED', '5', 'Active markets in today feed.'),
          const SizedBox(width: 12),
          _statCard('COMMODITIES', '5', 'Commodity coverage from synced rows.'),
          const SizedBox(width: 12),
          _statCard('TOP PRICE TODAY', 'Ksh 256.09', 'Highest observed price per kg.'),
          const SizedBox(width: 12),
          _statCard('PREDICTION CONFIDENCE', 'N/A', 'From the latest Oracle run.'),
        ],
      ),
    );
  }

  // ─── 4. Prediction Form ────────────────────────────────────────────────────
  Widget _buildPredictionForm() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Market Oracle Prediction',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Predict prices for a specific market and crop',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 20),
          AgriTextField(
            label: 'Date',
            hint: '05/14/2026',
            suffixIcon: const Icon(Icons.calendar_today, size: 18),
          ),
          const SizedBox(height: 16),
          AgriDropdown<String>(
            label: 'Region',
            value: 'Nairobi',
            items: const [
              DropdownMenuItem(value: 'Nairobi', child: Text('Nairobi')),
              DropdownMenuItem(value: 'Nakuru', child: Text('Nakuru')),
              DropdownMenuItem(value: 'Mombasa', child: Text('Mombasa')),
            ],
            onChanged: (_) {},
          ),
          const SizedBox(height: 16),
          AgriDropdown<String>(
            label: 'Market',
            value: 'Wakulima (Nairobi)',
            items: const [
              DropdownMenuItem(
                value: 'Wakulima (Nairobi)',
                child: Text('Wakulima (Nairobi)'),
              ),
              DropdownMenuItem(
                value: 'Marikiti (Nairobi)',
                child: Text('Marikiti (Nairobi)'),
              ),
            ],
            onChanged: (_) {},
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  SizedBox(
                    width: 32,
                    height: 20,
                    child: Switch(
                      value: false,
                      onChanged: (_) {},
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Text(
                    'Use best market',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                  ),
                ],
              ),
              const Text(
                '2 markets available',
                style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 16),
          AgriDropdown<String>(
            label: 'Commodity',
            value: null,
            hint: 'Select commodity',
            items: const [
              DropdownMenuItem(value: 'Tomatoes', child: Text('Tomatoes')),
              DropdownMenuItem(value: 'Onions', child: Text('Onions')),
              DropdownMenuItem(value: 'Irish Potato', child: Text('Irish Potato')),
              DropdownMenuItem(value: 'Kale', child: Text('Kale')),
              DropdownMenuItem(value: 'Cabbage', child: Text('Cabbage')),
            ],
            onChanged: (_) {},
          ),
          const SizedBox(height: 6),
          const Text(
            'Supported: Tomatoes, Onions, Irish Potato, Kale, Cabbage',
            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 16),
          AgriDropdown<String>(
            label: 'Price type',
            value: 'Retail',
            items: const [
              DropdownMenuItem(value: 'Retail', child: Text('Retail')),
              DropdownMenuItem(value: 'Wholesale', child: Text('Wholesale')),
            ],
            onChanged: (_) {},
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Previous month price',
            hint: 'Enter price',
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 20),
          AgriPrimaryButton(
            label: 'Run Prediction',
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // ─── 5. Prediction Result ──────────────────────────────────────────────────
  Widget _buildPredictionResult() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Prediction Result',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'Latest prediction for your inputs',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          SizedBox(height: 20),
          Center(
            child: Text(
              'Run a prediction to see results.',
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: AppTheme.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── 6. Economic Adjustment ────────────────────────────────────────────────
  Widget _buildEconomicAdjustment() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFE3F2FD),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF90CAF9)),
            ),
            child: const Text(
              'The AI model predicts prices from historical data. Economic signals (fuel, exchange rate, inflation) are applied as a post-prediction adjustment layer.',
              style: TextStyle(fontSize: 12, color: Color(0xFF1565C0), height: 1.4),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Economic adjustment: +17.2%',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'High confidence',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1B5E20),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Column(
                    children: [
                      Text(
                        'Model prediction',
                        style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'KES 55',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Column(
                    children: [
                      Text(
                        'Adjusted forecast',
                        style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'KES 64',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1B5E20),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'PRICE DRIVERS',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 10),
          _priceDriverRow('Fuel Price (KES/litre)', '+4.1%'),
          const SizedBox(height: 8),
          _priceDriverRow('USD/KES Exchange Rate', '+3.2%'),
          const SizedBox(height: 8),
          _priceDriverRow('Inflation Index', '+1.2%'),
          const SizedBox(height: 8),
          _priceDriverRow('Transport Cost Index', '+4.5%'),
          const SizedBox(height: 8),
          _priceDriverRow('Fertilizer Price Index', '+4.2%'),
        ],
      ),
    );
  }

  // ─── 7. Active Signals ─────────────────────────────────────────────────────
  Widget _buildActiveSignals() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Active Signals (5)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.3,
            children: [
              _signalCard('Fuel Price', '217 KES/L', 'EPRA Kenya', '+11.3%'),
              _signalCard('USD/KES Rate', '158 KES/USD', 'CBK', '+21.5%'),
              _signalCard('Inflation Index', '112 index', 'KNBS', '+12.0%'),
              _signalCard('Transport Cost In...', '118 index', 'Derived from fuel price', '+18.0%'),
              _signalCard('Fertilizer Price In...', '135 index', 'AMIS Kenya', '+35.0%'),
            ],
          ),
          const SizedBox(height: 14),
          AgriSecondaryButton(
            label: 'Update an economic signal',
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // ─── 8. Adjustment Methodology ─────────────────────────────────────────────
  Widget _buildAdjustmentMethodology() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Adjustment Methodology',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          SizedBox(height: 12),
          Text(
            '• Fuel: 20% sensitivity (transport cost pass-through)',
            style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.6),
          ),
          Text(
            '• Exchange rate: 15% sensitivity (imported inputs)',
            style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.6),
          ),
          Text(
            '• Inflation: 10% sensitivity (general cost push)',
            style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.6),
          ),
          Text(
            '• Transport index: 25% sensitivity (direct logistics)',
            style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.6),
          ),
          Text(
            '• Fertilizer: 12% sensitivity (input cost)',
            style: TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.6),
          ),
          SizedBox(height: 8),
          Text(
            'Adjustment capped at ±40% to prevent extremes',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textMuted,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  // ─── 9. Today's Prices ─────────────────────────────────────────────────────
  Widget _buildTodaysPrices() {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Today's Prices",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          const Text(
            'Latest market prices for today',
            style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 14),
          // Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Expanded(flex: 3, child: Text('Market', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted))),
                Expanded(flex: 3, child: Text('Commodity', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted))),
                Expanded(flex: 2, child: Text('Price/kg', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted))),
                Expanded(flex: 2, child: Text('Type', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.textMuted))),
              ],
            ),
          ),
          const SizedBox(height: 4),
          _priceTableRow('Wakulima', 'Tomatoes', 'Ksh 185.49', 'Retail', '1 min ago'),
          _priceTableRow('Wakulima', 'Tomatoes', 'Ksh 244.26', 'Wholesale', '1 min ago'),
          _priceTableRow('Nakuru Market', 'Tomatoes', 'Ksh 185.22', 'Retail', '< 1 min ago'),
          _priceTableRow('Nakuru Market', 'Tomatoes', 'Ksh 244.65', 'Wholesale', '< 1 min ago'),
        ],
      ),
    );
  }

  // ─── 10. Recommended Markets ───────────────────────────────────────────────
  Widget _buildRecommendedMarkets() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recommended Markets',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Best prices for your selection',
          style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 12),
        _recommendedMarketCard(
          name: 'Marikiti (Nairobi)',
          badges: ['Best price', 'Fresh'],
          description: 'Highest price today',
          updated: 'Updated less than a minute ago',
          price: 'Ksh 179.92',
          isBest: true,
        ),
        const SizedBox(height: 12),
        _recommendedMarketCard(
          name: 'Wakulima',
          badges: ['Fresh'],
          description: 'Good demand signal',
          updated: 'Updated less than a minute ago',
          price: 'Ksh 179.62',
          isBest: false,
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

  Widget _oracleRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppTheme.textMuted,
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }

  Widget _statCard(String title, String value, String subtitle) {
    return Container(
      width: 160,
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
          Text(
            title,
            style: const TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _priceDriverRow(String label, String change) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: Color(0xFFC62828),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          change,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Color(0xFFC62828),
          ),
        ),
      ],
    );
  }

  Widget _signalCard(String title, String value, String source, String change) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            source,
            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            change,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFFC62828),
            ),
          ),
        ],
      ),
    );
  }

  Widget _priceTableRow(
    String market,
    String commodity,
    String price,
    String type,
    String updated,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppTheme.border, width: 0.5)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                flex: 3,
                child: Text(
                  market,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textPrimary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Expanded(
                flex: 3,
                child: Text(
                  commodity,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  price,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  type,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              updated,
              style: const TextStyle(fontSize: 9, color: AppTheme.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _recommendedMarketCard({
    required String name,
    required List<String> badges,
    required String description,
    required String updated,
    required String price,
    required bool isBest,
  }) {
    return AgriCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              ...badges.map(
                (b) => Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: b == 'Best price'
                          ? const Color(0xFFE8F5E9)
                          : const Color(0xFFF1F8E9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      b,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: b == 'Best price'
                            ? const Color(0xFF1B5E20)
                            : const Color(0xFF33691E),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            updated,
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                price,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              SizedBox(
                height: 36,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: const Text(
                    'Use this market',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
