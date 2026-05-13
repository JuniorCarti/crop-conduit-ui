import 'package:flutter/material.dart';
import 'auth/login_screen.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Data model
// ─────────────────────────────────────────────────────────────────────────────
class _OnboardingData {
  const _OnboardingData({
    required this.title,
    required this.subtitle,
    required this.accentColor,
    required this.bgGradient,
    required this.card,
  });

  final String title;
  final String subtitle;
  final Color accentColor;
  final List<Color> bgGradient;
  final _IntelCard card;
}

class _IntelCard {
  const _IntelCard({
    required this.eyebrow,
    required this.heading,
    required this.rows,
    required this.footer,
  });

  final String eyebrow;
  final String heading;
  final List<_IntelRow> rows;
  final String footer;
}

class _IntelRow {
  const _IntelRow({
    required this.icon,
    required this.label,
    required this.value,
    required this.status,
    required this.statusColor,
    required this.rowColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final String status;
  final Color statusColor;
  final Color rowColor;
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding content
// ─────────────────────────────────────────────────────────────────────────────
final _pages = [
  // ── Screen 1: Climate Intelligence ──────────────────────────────────────
  _OnboardingData(
    title: 'Climate Intelligence\nfor Farmers',
    subtitle:
        'Receive rainfall forecasts, drought alerts, and planting recommendations in real time.',
    accentColor: const Color(0xFF1B5E20),
    bgGradient: const [Color(0xFF1B3A2A), Color(0xFF2E5E3E), Color(0xFF3A7A50)],
    card: const _IntelCard(
      eyebrow: 'AGRISMART AI',
      heading: 'Field Intelligence',
      rows: [
        _IntelRow(
          icon: Icons.water_drop_rounded,
          label: 'Rainfall Forecast',
          value: '84%',
          status: 'Favorable',
          statusColor: Color(0xFF38BDF8),
          rowColor: Color(0x1538BDF8),
        ),
        _IntelRow(
          icon: Icons.thermostat_rounded,
          label: 'Frost Alert',
          value: 'Moderate',
          status: 'Risk',
          statusColor: Color(0xFFFBBF24),
          rowColor: Color(0x15FBBF24),
        ),
        _IntelRow(
          icon: Icons.trending_up_rounded,
          label: 'Maize Price',
          value: 'KES 4,500',
          status: '↑ 3.2%',
          statusColor: Color(0xFF4ADE80),
          rowColor: Color(0x154ADE80),
        ),
        _IntelRow(
          icon: Icons.eco_rounded,
          label: 'AI Planting',
          value: 'Favorable',
          status: 'Recommended',
          statusColor: Color(0xFFA3E635),
          rowColor: Color(0x15A3E635),
        ),
      ],
      footer: 'Updated just now',
    ),
  ),

  // ── Screen 2: Market Access ──────────────────────────────────────────────
  _OnboardingData(
    title: 'Better\nMarket Access',
    subtitle:
        'Track crop prices, connect with buyers, and sell produce smarter.',
    accentColor: const Color(0xFF1565C0),
    bgGradient: const [Color(0xFF0D2B4E), Color(0xFF1565C0), Color(0xFF1976D2)],
    card: const _IntelCard(
      eyebrow: 'AGRISMART MARKET',
      heading: 'Price Intelligence',
      rows: [
        _IntelRow(
          icon: Icons.grain_rounded,
          label: 'Maize — Nairobi',
          value: 'KES 4,500/bag',
          status: '↑ 5.1%',
          statusColor: Color(0xFF4ADE80),
          rowColor: Color(0x154ADE80),
        ),
        _IntelRow(
          icon: Icons.spa_rounded,
          label: 'Tomatoes — Mombasa',
          value: 'KES 3,200/crate',
          status: '↓ 2.3%',
          statusColor: Color(0xFFF87171),
          rowColor: Color(0x15F87171),
        ),
        _IntelRow(
          icon: Icons.grass_rounded,
          label: 'Beans — Kisumu',
          value: 'KES 6,800/bag',
          status: '↑ 8.4%',
          statusColor: Color(0xFF4ADE80),
          rowColor: Color(0x154ADE80),
        ),
        _IntelRow(
          icon: Icons.people_rounded,
          label: 'Active Buyers',
          value: '1,240',
          status: 'Online',
          statusColor: Color(0xFF38BDF8),
          rowColor: Color(0x1538BDF8),
        ),
      ],
      footer: 'Live market data',
    ),
  ),

  // ── Screen 3: Transport & Logistics ─────────────────────────────────────
  _OnboardingData(
    title: 'Transport\n& Logistics',
    subtitle:
        'Connect with trusted drivers and move produce from farms to markets efficiently.',
    accentColor: const Color(0xFF4527A0),
    bgGradient: const [Color(0xFF1A0A3E), Color(0xFF4527A0), Color(0xFF5E35B1)],
    card: const _IntelCard(
      eyebrow: 'AGRISMART LOGISTICS',
      heading: 'Fleet Intelligence',
      rows: [
        _IntelRow(
          icon: Icons.local_shipping_rounded,
          label: 'Active Drivers',
          value: '38 Online',
          status: 'Available',
          statusColor: Color(0xFF4ADE80),
          rowColor: Color(0x154ADE80),
        ),
        _IntelRow(
          icon: Icons.route_rounded,
          label: 'Nairobi → Mombasa',
          value: '490 km',
          status: 'En Route',
          statusColor: Color(0xFF38BDF8),
          rowColor: Color(0x1538BDF8),
        ),
        _IntelRow(
          icon: Icons.inventory_2_rounded,
          label: 'Cargo in Transit',
          value: '12.4 tonnes',
          status: 'On Track',
          statusColor: Color(0xFFA3E635),
          rowColor: Color(0x15A3E635),
        ),
        _IntelRow(
          icon: Icons.verified_rounded,
          label: 'Deliveries Today',
          value: '24 Completed',
          status: '100%',
          statusColor: Color(0xFF4ADE80),
          rowColor: Color(0x154ADE80),
        ),
      ],
      footer: 'Real-time tracking',
    ),
  ),
];

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  static const routeName = '/onboarding';

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;

  void _goToAuth() =>
      Navigator.of(context).pushReplacementNamed(LoginScreen.routeName);

  void _next() {
    if (_page < _pages.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeOutCubic,
      );
    } else {
      _goToAuth();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final current = _pages[_page];

    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: current.bgGradient,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Top bar ────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Image.asset(
                      'assets/brand/agrismart_logo.png',
                      height: 32,
                      fit: BoxFit.contain,
                      color: Colors.white,
                      colorBlendMode: BlendMode.srcIn,
                    ),
                    TextButton(
                      onPressed: _goToAuth,
                      child: Text(
                        'Skip',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.7),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Pages ──────────────────────────────────────────
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  onPageChanged: (i) => setState(() => _page = i),
                  itemCount: _pages.length,
                  itemBuilder: (_, i) => _OnboardingPage(data: _pages[i]),
                ),
              ),

              // ── Bottom controls ────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 36),
                child: Column(
                  children: [
                    // Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(_pages.length, (i) {
                        final active = i == _page;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 280),
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: active ? 24 : 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: active
                                ? Colors.white
                                : Colors.white.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        );
                      }),
                    ),

                    const SizedBox(height: 20),

                    // Buttons
                    Row(
                      children: [
                        if (_page > 0) ...[
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _controller.previousPage(
                                duration: const Duration(milliseconds: 350),
                                curve: Curves.easeOutCubic,
                              ),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.white,
                                side: BorderSide(
                                  color: Colors.white.withValues(alpha: 0.35),
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                minimumSize: const Size(0, 52),
                              ),
                              child: const Text('Back'),
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: _next,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: current.accentColor,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              minimumSize: const Size(0, 52),
                            ),
                            child: Text(
                              _page == _pages.length - 1
                                  ? 'Get Started'
                                  : 'Next',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single onboarding page
// ─────────────────────────────────────────────────────────────────────────────
class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({required this.data});

  final _OnboardingData data;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Column(
        children: [
          // ── Intelligence card ──────────────────────────────────
          Expanded(
            flex: 6,
            child: Center(child: _IntelligenceCard(card: data.card)),
          ),

          const SizedBox(height: 24),

          // ── Text ───────────────────────────────────────────────
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.title,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.15,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  data.subtitle,
                  style: TextStyle(
                    fontSize: 15,
                    color: Colors.white.withValues(alpha: 0.7),
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Intelligence card widget — mirrors the web hero floating card
// ─────────────────────────────────────────────────────────────────────────────
class _IntelligenceCard extends StatelessWidget {
  const _IntelligenceCard({required this.card});

  final _IntelCard card;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        // Glassmorphism
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.15),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              // ── Card header ──────────────────────────────────
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          card.eyebrow,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withValues(alpha: 0.45),
                            letterSpacing: 1.4,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          card.heading,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Live badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4ADE80).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: const Color(0xFF4ADE80).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _PulseDot(color: const Color(0xFF4ADE80)),
                        const SizedBox(width: 4),
                        const Text(
                          'Live',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF4ADE80),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),
              Container(height: 1, color: Colors.white.withValues(alpha: 0.08)),
              const SizedBox(height: 8),

              // ── Rows — expand to fill remaining space ─────────
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: card.rows
                      .map((row) => _IntelRowWidget(row: row))
                      .toList(),
                ),
              ),

              const SizedBox(height: 8),
              Container(height: 1, color: Colors.white.withValues(alpha: 0.08)),
              const SizedBox(height: 8),

              // ── Footer ───────────────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    card.footer,
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                  RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: 'Powered by ',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.3),
                          ),
                        ),
                        const TextSpan(
                          text: 'AgriSmart AI',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF4ADE80),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single intelligence row
// ─────────────────────────────────────────────────────────────────────────────
class _IntelRowWidget extends StatelessWidget {
  const _IntelRowWidget({required this.row});

  final _IntelRow row;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: row.rowColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.08),
        ),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(row.icon, size: 15, color: row.statusColor),
          ),

          const SizedBox(width: 10),

          // Label + value
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  row.label,
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.5),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  row.value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ),
              ],
            ),
          ),

          // Status
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _PulseDot(color: row.statusColor),
              const SizedBox(width: 4),
              Text(
                row.status,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: row.statusColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Animated pulse dot
// ─────────────────────────────────────────────────────────────────────────────
class _PulseDot extends StatefulWidget {
  const _PulseDot({required this.color});

  final Color color;

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: widget.color,
        ),
      ),
    );
  }
}
