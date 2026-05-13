import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/agri_widgets.dart';
import '../../home/driver_home_screen.dart';

const _fleetModes = [
  _FleetMode('owned', 'Owned Fleet'),
  _FleetMode('subcontracted', 'Subcontracted Fleet'),
  _FleetMode('mixed', 'Mixed (Owned + Subcontracted)'),
];

class _FleetMode {
  const _FleetMode(this.value, this.label);
  final String value;
  final String label;
}

class TransportRegistrationScreen extends StatefulWidget {
  const TransportRegistrationScreen({super.key});

  static const routeName = '/registration/transport';

  @override
  State<TransportRegistrationScreen> createState() =>
      _TransportRegistrationScreenState();
}

class _TransportRegistrationScreenState
    extends State<TransportRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _companyNameCtrl = TextEditingController();
  final _contactNameCtrl = TextEditingController();
  final _contactPhoneCtrl = TextEditingController();
  final _contactEmailCtrl = TextEditingController();
  final _countyCtrl = TextEditingController();
  final _serviceRegionsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String _fleetMode = 'owned';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _companyNameCtrl.dispose();
    _contactNameCtrl.dispose();
    _contactPhoneCtrl.dispose();
    _contactEmailCtrl.dispose();
    _countyCtrl.dispose();
    _serviceRegionsCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _loading = false);
      Navigator.of(context).pushReplacementNamed(DriverHomeScreen.routeName);
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
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: const BoxDecoration(
                color: AppTheme.surface,
                border: Border(bottom: BorderSide(color: AppTheme.border)),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
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
                          'Transport & Logistics',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(
                          'Register your transport company',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.driverColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.local_shipping_rounded,
                      color: AppTheme.driverColor,
                      size: 22,
                    ),
                  ),
                ],
              ),
            ),

            // ── Form ──────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Info banner
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.driverColor.withValues(alpha: 0.06),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.driverColor.withValues(alpha: 0.15),
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.info_outline_rounded,
                              color: AppTheme.driverColor,
                              size: 18,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Provide company details to activate your transport portal.',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.driverColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Auth fields
                      AgriTextField(
                        label: 'Email *',
                        hint: 'your@email.com',
                        controller: _emailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        prefixIcon: const Icon(Icons.mail_outline_rounded, size: 20, color: AppTheme.textMuted),
                        validator: (v) => v?.isEmpty == true ? 'Required' : null,
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
                        validator: (v) => v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Confirm Password *',
                        hint: '••••••••',
                        controller: _confirmPasswordCtrl,
                        obscureText: _obscureConfirm,
                        textInputAction: TextInputAction.next,
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 20, color: AppTheme.textMuted),
                          onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                        ),
                        validator: (v) {
                          if (v?.isEmpty == true) return 'Required';
                          if (v != _passwordCtrl.text) return 'Passwords do not match';
                          return null;
                        },
                      ),

                      const SizedBox(height: 24),
                      const Divider(),
                      const SizedBox(height: 20),

                      // Company details
                      AgriTextField(
                        label: 'Company Name *',
                        hint: 'e.g. Rift Valley Logistics',
                        controller: _companyNameCtrl,
                        textInputAction: TextInputAction.next,
                        validator: (v) => v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Primary Contact Name',
                        hint: 'e.g. Sarah Wanjiku',
                        controller: _contactNameCtrl,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Contact Phone *',
                        hint: '+254 7xx xxx xxx',
                        controller: _contactPhoneCtrl,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        validator: (v) => v?.isEmpty == true ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Contact Email',
                        hint: 'ops@company.co.ke',
                        controller: _contactEmailCtrl,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'County / HQ',
                        hint: 'Nakuru',
                        controller: _countyCtrl,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 20),

                      // Fleet mode
                      Text('Fleet Ownership', style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: 10),
                      Column(
                        children: _fleetModes.map((mode) {
                          final selected = _fleetMode == mode.value;
                          return GestureDetector(
                            onTap: () => setState(() => _fleetMode = mode.value),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 160),
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: selected ? AppTheme.driverColor.withValues(alpha: 0.08) : AppTheme.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selected ? AppTheme.driverColor : AppTheme.border,
                                  width: selected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    selected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                                    color: selected ? AppTheme.driverColor : AppTheme.textMuted,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    mode.label,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                                      color: selected ? AppTheme.driverColor : AppTheme.textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Service Regions',
                        hint: 'Nakuru, Nairobi, Eldoret',
                        controller: _serviceRegionsCtrl,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Comma-separated counties or corridors.',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      const SizedBox(height: 16),
                      AgriTextField(
                        label: 'Notes',
                        hint: 'Optional details about your fleet or services',
                        controller: _notesCtrl,
                        maxLines: 3,
                        textInputAction: TextInputAction.done,
                      ),

                      const SizedBox(height: 32),

                      AgriPrimaryButton(
                        label: 'Submit Registration',
                        onPressed: _submit,
                        loading: _loading,
                        color: AppTheme.driverColor,
                        icon: Icons.check_rounded,
                      ),

                      const SizedBox(height: 16),

                      Center(
                        child: TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text('Back to registration'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
