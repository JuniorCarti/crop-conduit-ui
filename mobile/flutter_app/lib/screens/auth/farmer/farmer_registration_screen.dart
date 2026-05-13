import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/agri_widgets.dart';
import '../../home/farmer_home_screen.dart';

// ── Kenya counties (subset — full list to be loaded from data layer) ──────────
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

const _farmingTypes = ['Crop', 'Livestock', 'Mixed'];

const _commonCrops = [
  'Maize', 'Wheat', 'Sorghum', 'Beans', 'Tomatoes', 'Potatoes',
  'Onions', 'Cabbages', 'Carrots', 'Green Beans', 'Peas', 'Rice',
  'Millet', 'Groundnuts',
];

const _commonLivestock = [
  'Cattle', 'Goats', 'Sheep', 'Chicken', 'Pigs', 'Rabbits',
  'Ducks', 'Turkeys',
];

class FarmerRegistrationScreen extends StatefulWidget {
  const FarmerRegistrationScreen({super.key});

  static const routeName = '/registration/farmer';

  @override
  State<FarmerRegistrationScreen> createState() =>
      _FarmerRegistrationScreenState();
}

class _FarmerRegistrationScreenState extends State<FarmerRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  int _step = 1;
  static const _totalSteps = 3;
  bool _loading = false;

  // ── Form state ─────────────────────────────────────────────────
  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _villageCtrl = TextEditingController();
  final _farmSizeCtrl = TextEditingController();
  final _experienceCtrl = TextEditingController();
  final _monthlyProductionCtrl = TextEditingController();
  final _toolsCtrl = TextEditingController();
  final _challengesCtrl = TextEditingController();

  String? _county;
  String? _constituency;
  String? _ward;
  String _farmingType = '';
  final List<String> _crops = [];
  final List<String> _livestock = [];

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _villageCtrl.dispose();
    _farmSizeCtrl.dispose();
    _experienceCtrl.dispose();
    _monthlyProductionCtrl.dispose();
    _toolsCtrl.dispose();
    _challengesCtrl.dispose();
    super.dispose();
  }

  bool get _canProceed {
    if (_step == 1) {
      return _fullNameCtrl.text.isNotEmpty &&
          _phoneCtrl.text.isNotEmpty &&
          _county != null &&
          _villageCtrl.text.isNotEmpty &&
          _farmSizeCtrl.text.isNotEmpty &&
          _farmingType.isNotEmpty;
    }
    if (_step == 2) {
      if (_farmingType == 'Crop') return _crops.isNotEmpty;
      if (_farmingType == 'Livestock') return _livestock.isNotEmpty;
      return _crops.isNotEmpty || _livestock.isNotEmpty;
    }
    return _phoneCtrl.text.isNotEmpty;
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
    // TODO: Firebase integration
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed(FarmerHomeScreen.routeName);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ────────────────────────────────────────────
            _buildHeader(context),

            // ── Scrollable form ───────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Form(
                  key: _formKey,
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 280),
                    transitionBuilder: (child, anim) => FadeTransition(
                      opacity: anim,
                      child: SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0.04, 0),
                          end: Offset.zero,
                        ).animate(anim),
                        child: child,
                      ),
                    ),
                    child: KeyedSubtree(
                      key: ValueKey(_step),
                      child: _buildStep(),
                    ),
                  ),
                ),
              ),
            ),

            // ── Bottom actions ────────────────────────────────────
            _buildBottomBar(context),
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
                      'Farmer Registration',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(
                      'Step $_step of $_totalSteps · ${_stepLabel(_step)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          AgriStepIndicator(
            currentStep: _step,
            totalSteps: _totalSteps,
            stepLabels: const ['Identity', 'Farm Details', 'Review'],
          ),
        ],
      ),
    );
  }

  String _stepLabel(int step) {
    switch (step) {
      case 1:
        return 'Identity';
      case 2:
        return 'Farm Details';
      default:
        return 'Review & Submit';
    }
  }

  Widget _buildStep() {
    switch (_step) {
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      default:
        return _buildStep3();
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
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Phone Number *',
          hint: '+254 712 345 678',
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          prefixIcon: const Icon(Icons.phone_outlined, size: 20, color: AppTheme.textMuted),
          onChanged: (_) => setState(() {}),
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        ),
        const SizedBox(height: 16),
        AgriDropdown<String>(
          label: 'County *',
          value: _county,
          hint: 'Select county',
          items: _kenyaCounties
              .map((c) => DropdownMenuItem(value: c, child: Text(c)))
              .toList(),
          onChanged: (v) => setState(() {
            _county = v;
            _constituency = null;
            _ward = null;
          }),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Constituency',
          hint: 'Enter constituency',
          textInputAction: TextInputAction.next,
          onChanged: (v) => setState(() => _constituency = v),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Ward',
          hint: 'Enter ward',
          textInputAction: TextInputAction.next,
          onChanged: (v) => setState(() => _ward = v),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Village *',
          hint: 'Enter village',
          controller: _villageCtrl,
          textInputAction: TextInputAction.next,
          onChanged: (_) => setState(() {}),
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Farm Size (acres) *',
          hint: 'e.g. 5',
          controller: _farmSizeCtrl,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          onChanged: (_) => setState(() {}),
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        ),
        const SizedBox(height: 20),
        Text(
          'Type of Farming *',
          style: Theme.of(context).textTheme.labelLarge,
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          children: _farmingTypes.map((type) {
            final selected = _farmingType == type;
            return GestureDetector(
              onTap: () => setState(() => _farmingType = type),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: selected
                      ? AppTheme.farmerColor.withValues(alpha: 0.1)
                      : AppTheme.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: selected ? AppTheme.farmerColor : AppTheme.border,
                    width: selected ? 1.5 : 1,
                  ),
                ),
                child: Text(
                  type,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                    color: selected ? AppTheme.farmerColor : AppTheme.textMuted,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── Step 2: Farm Details ──────────────────────────────────────
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_farmingType == 'Crop' || _farmingType == 'Mixed') ...[
          Text(
            'Crops You Grow *',
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _commonCrops.map((crop) {
              return AgriChip(
                label: crop,
                selected: _crops.contains(crop),
                color: AppTheme.farmerColor,
                onTap: () => setState(() {
                  _crops.contains(crop)
                      ? _crops.remove(crop)
                      : _crops.add(crop);
                }),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],
        if (_farmingType == 'Livestock' || _farmingType == 'Mixed') ...[
          Text(
            'Livestock You Keep *',
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _commonLivestock.map((animal) {
              return AgriChip(
                label: animal,
                selected: _livestock.contains(animal),
                color: AppTheme.farmerColor,
                onTap: () => setState(() {
                  _livestock.contains(animal)
                      ? _livestock.remove(animal)
                      : _livestock.add(animal);
                }),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  // ── Step 3: Review & Submit ───────────────────────────────────
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AgriTextField(
          label: 'Farm Experience (years)',
          hint: 'e.g. 5',
          controller: _experienceCtrl,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.next,
          prefixIcon: const Icon(Icons.calendar_today_outlined, size: 18, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Estimated Monthly Production',
          hint: 'e.g. 500kg maize, 200kg tomatoes',
          controller: _monthlyProductionCtrl,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Tools or Equipment You Own',
          hint: 'e.g. Tractor, Plow, Irrigation system...',
          controller: _toolsCtrl,
          maxLines: 3,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 16),
        AgriTextField(
          label: 'Primary Challenges You Face',
          hint: 'e.g. Water scarcity, Pest control, Market access...',
          controller: _challengesCtrl,
          maxLines: 3,
          textInputAction: TextInputAction.done,
        ),
        const SizedBox(height: 24),

        // Review summary card
        AgriCard(
          borderColor: AppTheme.farmerColor.withValues(alpha: 0.2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.check_circle_outline_rounded,
                      color: AppTheme.farmerColor, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Review Summary',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.farmerColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _ReviewRow(label: 'Full Name', value: _fullNameCtrl.text),
              _ReviewRow(label: 'Phone', value: _phoneCtrl.text),
              _ReviewRow(
                label: 'Location',
                value: [_villageCtrl.text, _ward, _constituency, _county]
                    .where((e) => e != null && e.isNotEmpty)
                    .join(', '),
              ),
              _ReviewRow(label: 'Farm Size', value: '${_farmSizeCtrl.text} acres'),
              _ReviewRow(label: 'Farming Type', value: _farmingType),
              if (_crops.isNotEmpty)
                _ReviewRow(label: 'Crops', value: _crops.join(', ')),
              if (_livestock.isNotEmpty)
                _ReviewRow(label: 'Livestock', value: _livestock.join(', ')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(BuildContext context) {
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
        color: AppTheme.farmerColor,
        icon: _step == _totalSteps
            ? Icons.check_rounded
            : Icons.arrow_forward_rounded,
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
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textMuted,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
