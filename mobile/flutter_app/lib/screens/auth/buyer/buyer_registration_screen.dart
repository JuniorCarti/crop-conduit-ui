import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/agri_widgets.dart';
import '../../home/buyer_home_screen.dart';

const _buyerCategories = ['Trader', 'Retailer', 'Offtaker'];
const _buyerScopes = ['LOCAL', 'INTERNATIONAL'];

const _cropOptions = [
  'Tomatoes', 'Kale (Sukuma wiki)', 'Cabbage', 'Onion', 'Irish Potatoes',
  'Maize', 'Beans', 'Carrots', 'Peas', 'Bananas', 'Avocado', 'Mangoes',
];

const _kenyaCounties = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale',
  'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru',
  'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu',
  'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
];

const _countryOptions = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'DR Congo',
  'Ethiopia', 'South Sudan', 'Somalia', 'Zambia', 'Nigeria', 'Ghana',
  'South Africa', 'United Kingdom', 'United States', 'Netherlands',
  'Germany', 'France', 'UAE', 'India', 'China',
];

class BuyerRegistrationScreen extends StatefulWidget {
  const BuyerRegistrationScreen({super.key});

  static const routeName = '/registration/buyer';

  @override
  State<BuyerRegistrationScreen> createState() =>
      _BuyerRegistrationScreenState();
}

class _BuyerRegistrationScreenState extends State<BuyerRegistrationScreen> {
  int _step = 1;
  static const _totalSteps = 3;
  bool _loading = false;

  // ── Step 1 ─────────────────────────────────────────────────────
  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _buyerScope = 'LOCAL';
  String _buyerCategory = '';

  // ── Step 2 LOCAL ───────────────────────────────────────────────
  String? _county;
  final List<String> _crops = [];

  // ── Step 2 INTERNATIONAL ──────────────────────────────────────
  String? _buyerCountry;
  final _buyerRegionCtrl = TextEditingController();
  final _destinationsCtrl = TextEditingController();
  final _companyNameCtrl = TextEditingController();
  final _yearsInBusinessCtrl = TextEditingController();
  final _monthlyPurchaseVolumeCtrl = TextEditingController();
  final _companyRegNoCtrl = TextEditingController();
  final _taxIdCtrl = TextEditingController();

  // ── Step 3 ─────────────────────────────────────────────────────
  // Trader
  final _businessNameCtrl = TextEditingController();
  final _paymentMethodCtrl = TextEditingController();
  // Retailer
  final _monthlyDemandCtrl = TextEditingController();
  final _storageCapabilityCtrl = TextEditingController();
  final _contractPreferenceCtrl = TextEditingController();
  final _qualityGradeCtrl = TextEditingController();
  // Offtaker
  final _weeklyVolumeCtrl = TextEditingController();
  final _packagingRequirementCtrl = TextEditingController();
  final _paymentTermsCtrl = TextEditingController();
  final List<String> _deliveryDays = [];

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _buyerRegionCtrl.dispose();
    _destinationsCtrl.dispose();
    _companyNameCtrl.dispose();
    _yearsInBusinessCtrl.dispose();
    _monthlyPurchaseVolumeCtrl.dispose();
    _companyRegNoCtrl.dispose();
    _taxIdCtrl.dispose();
    _businessNameCtrl.dispose();
    _paymentMethodCtrl.dispose();
    _monthlyDemandCtrl.dispose();
    _storageCapabilityCtrl.dispose();
    _contractPreferenceCtrl.dispose();
    _qualityGradeCtrl.dispose();
    _weeklyVolumeCtrl.dispose();
    _packagingRequirementCtrl.dispose();
    _paymentTermsCtrl.dispose();
    super.dispose();
  }

  bool get _canProceed {
    if (_step == 1) {
      return _fullNameCtrl.text.isNotEmpty &&
          _phoneCtrl.text.isNotEmpty &&
          _buyerCategory.isNotEmpty;
    }
    if (_step == 2) {
      if (_crops.isEmpty) return false;
      if (_buyerScope == 'LOCAL') return _county != null;
      return _buyerCountry != null &&
          _buyerRegionCtrl.text.isNotEmpty &&
          _destinationsCtrl.text.isNotEmpty &&
          _companyNameCtrl.text.isNotEmpty &&
          _yearsInBusinessCtrl.text.isNotEmpty &&
          _monthlyPurchaseVolumeCtrl.text.isNotEmpty &&
          _companyRegNoCtrl.text.isNotEmpty &&
          _taxIdCtrl.text.isNotEmpty;
    }
    return true;
  }

  void _next() {
    if (_step < _totalSteps) {
      setState(() => _step++);
    } else {
      _submit();
    }
  }

  void _back() {
    if (_step > 1) {
      setState(() => _step--);
    } else {
      Navigator.of(context).pop();
    }
  }

  void _submit() {
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed(BuyerHomeScreen.routeName);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 260),
                  transitionBuilder: (child, anim) => FadeTransition(
                    opacity: anim,
                    child: child,
                  ),
                  child: KeyedSubtree(
                    key: ValueKey(_step),
                    child: _buildStep(),
                  ),
                ),
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(bottom: BorderSide(color: AppTheme.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: _back,
                icon: const Icon(Icons.arrow_back_rounded),
                style: IconButton.styleFrom(
                  backgroundColor: AppTheme.background,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Buyer Registration',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      'Step $_step of $_totalSteps · ${_stepLabel(_step)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.buyerColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.store_rounded,
                  color: AppTheme.buyerColor,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AgriStepIndicator(
            currentStep: _step,
            totalSteps: _totalSteps,
            stepLabels: const ['Identity', 'Business', 'Review'],
          ),
        ],
      ),
    );
  }

  String _stepLabel(int step) {
    switch (step) {
      case 1: return 'Identity';
      case 2: return 'Business Details';
      default: return 'Contacts & Review';
    }
  }

  Widget _buildStep() {
    switch (_step) {
      case 1: return _buildStep1();
      case 2: return _buildStep2();
      default: return _buildStep3();
    }
  }

  // ── Step 1: Identity ──────────────────────────────────────────
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AgriTextField(
          label: 'Full Name *',
          hint: 'Enter your full name',
          controller: _fullNameCtrl,
          textInputAction: TextInputAction.next,
          prefixIcon: const Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.textMuted),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Phone *',
          hint: '+254 712 345 678',
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          prefixIcon: const Icon(Icons.phone_outlined, size: 20, color: AppTheme.textMuted),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Email *',
          hint: 'you@example.com',
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Password *',
          hint: '••••••••',
          controller: _passwordCtrl,
          obscureText: _obscurePassword,
          textInputAction: TextInputAction.next,
          suffixIcon: IconButton(
            icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppTheme.textMuted),
            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          ),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Confirm Password *',
          hint: '••••••••',
          controller: _confirmPasswordCtrl,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          suffixIcon: IconButton(
            icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppTheme.textMuted),
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
          ),
        ),
        const SizedBox(height: 20),

        // Buyer type toggle
        Text('Buyer Type *', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: _buyerScopes.map((scope) {
              final selected = _buyerScope == scope;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _buyerScope = scope),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 160),
                    margin: const EdgeInsets.all(4),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.buyerColor : Colors.transparent,
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Text(
                      scope == 'LOCAL' ? 'Local Buyer' : 'International Buyer',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: selected ? Colors.white : AppTheme.textMuted,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 20),

        // Buyer category
        Text('Buyer Category *', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 10),
        Column(
          children: _buyerCategories.map((cat) {
            final selected = _buyerCategory == cat;
            return GestureDetector(
              onTap: () => setState(() => _buyerCategory = cat),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: selected ? AppTheme.buyerColor.withValues(alpha: 0.08) : AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: selected ? AppTheme.buyerColor : AppTheme.border,
                    width: selected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      selected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                      color: selected ? AppTheme.buyerColor : AppTheme.textMuted,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      cat,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                        color: selected ? AppTheme.buyerColor : AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── Step 2: Business Details ──────────────────────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_buyerScope == 'LOCAL') ...[
          AgriDropdown<String>(
            label: 'County *',
            value: _county,
            hint: 'Select county',
            items: _kenyaCounties.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (v) => setState(() { _county = v; }),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Sub-County *',
            hint: 'Enter sub-county',
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Ward *',
            hint: 'Enter ward',
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Location *',
            hint: 'Enter location',
            textInputAction: TextInputAction.done,
            onChanged: (_) => setState(() {}),
          ),
        ] else ...[
          AgriDropdown<String>(
            label: 'Buyer Country *',
            value: _buyerCountry,
            hint: 'Select country',
            items: _countryOptions.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (v) => setState(() => _buyerCountry = v),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'City / Region / State *',
            controller: _buyerRegionCtrl,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Countries/Destinations you import to *',
            hint: 'e.g. UAE, Netherlands, India',
            controller: _destinationsCtrl,
            maxLines: 2,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Company Name *',
            controller: _companyNameCtrl,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Years in Business *',
            controller: _yearsInBusinessCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Monthly Purchase Volume *',
            controller: _monthlyPurchaseVolumeCtrl,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Company Registration Number *',
            controller: _companyRegNoCtrl,
            textInputAction: TextInputAction.next,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),
          AgriTextField(
            label: 'Tax ID / Import License *',
            controller: _taxIdCtrl,
            textInputAction: TextInputAction.done,
            onChanged: (_) => setState(() {}),
          ),
        ],

        const SizedBox(height: 24),
        Text('Preferred Crops / Categories *', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _cropOptions.map((crop) {
            return AgriChip(
              label: crop,
              selected: _crops.contains(crop),
              color: AppTheme.buyerColor,
              onTap: () => setState(() {
                _crops.contains(crop) ? _crops.remove(crop) : _crops.add(crop);
              }),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── Step 3: Category-specific + Review ───────────────────────
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_buyerCategory == 'Trader') ...[
          AgriTextField(label: 'Business Name *', controller: _businessNameCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Payment Method *', hint: 'e.g. M-Pesa, Bank Transfer', controller: _paymentMethodCtrl, textInputAction: TextInputAction.done),
        ] else if (_buyerCategory == 'Retailer') ...[
          AgriTextField(label: 'Monthly Demand *', hint: 'e.g. 500kg tomatoes', controller: _monthlyDemandCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Storage Capability *', hint: 'e.g. Cold storage, 2 tonnes', controller: _storageCapabilityCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Contract Preference *', hint: 'e.g. Weekly, Monthly', controller: _contractPreferenceCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Quality Grade Preference *', hint: 'e.g. Grade A, Premium', controller: _qualityGradeCtrl, textInputAction: TextInputAction.done),
        ] else if (_buyerCategory == 'Offtaker') ...[
          AgriTextField(label: 'Weekly Required Volume *', controller: _weeklyVolumeCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Packaging Requirement *', controller: _packagingRequirementCtrl, textInputAction: TextInputAction.next),
          const SizedBox(height: 16),
          AgriTextField(label: 'Payment Terms *', controller: _paymentTermsCtrl, textInputAction: TextInputAction.done),
          const SizedBox(height: 16),
          Text('Preferred Delivery Days *', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) {
              return AgriChip(
                label: day,
                selected: _deliveryDays.contains(day),
                color: AppTheme.buyerColor,
                onTap: () => setState(() {
                  _deliveryDays.contains(day) ? _deliveryDays.remove(day) : _deliveryDays.add(day);
                }),
              );
            }).toList(),
          ),
        ],

        const SizedBox(height: 24),
        AgriCard(
          borderColor: AppTheme.buyerColor.withValues(alpha: 0.2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle_outline_rounded, color: AppTheme.buyerColor, size: 20),
                  const SizedBox(width: 8),
                  Text('Review Summary', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppTheme.buyerColor)),
                ],
              ),
              const SizedBox(height: 14),
              _ReviewRow(label: 'Full Name', value: _fullNameCtrl.text),
              _ReviewRow(label: 'Phone', value: _phoneCtrl.text),
              _ReviewRow(label: 'Buyer Type', value: _buyerScope),
              _ReviewRow(label: 'Category', value: _buyerCategory),
              if (_crops.isNotEmpty) _ReviewRow(label: 'Crops', value: _crops.join(', ')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.border)),
      ),
      child: AgriPrimaryButton(
        label: _step == _totalSteps ? 'Submit Registration' : 'Continue',
        onPressed: _canProceed ? _next : null,
        loading: _loading,
        color: AppTheme.buyerColor,
        icon: _step == _totalSteps ? Icons.check_rounded : Icons.arrow_forward_rounded,
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  const _ReviewRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textMuted)),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
