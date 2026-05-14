import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/agri_widgets.dart';
import 'registration_path_screen.dart';
import 'forgot_password_screen.dart';
import '../farmer/farmer_shell.dart';
import '../buyer/buyer_shell.dart';
import '../transport/transport_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static const routeName = '/login';

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _loading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // ── Hardcoded credentials for dev testing ──────────────────────
  static const _devCredentials = {
    'ridgejunior@gmail.com': _DevUser('ridge1234', 'farmer'),
    'ridgeabuto@gmail.com': _DevUser('ridge1234', 'buyer'),
    'ridgesenior@gmail.com': _DevUser('ridge1234', 'transport'),
  };

  String? _errorMessage;

  void _handleLogin() {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailCtrl.text.trim().toLowerCase();
    final password = _passwordCtrl.text;

    final devUser = _devCredentials[email];

    if (devUser == null || devUser.password != password) {
      setState(() => _errorMessage = 'Invalid email or password');
      return;
    }

    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    Future.delayed(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      setState(() => _loading = false);

      String route;
      switch (devUser.role) {
        case 'farmer':
          route = FarmerShell.routeName;
          break;
        case 'buyer':
          route = BuyerShell.routeName;
          break;
        case 'transport':
          route = TransportShell.routeName;
          break;
        default:
          route = FarmerShell.routeName;
      }

      Navigator.of(context).pushNamedAndRemoveUntil(route, (r) => false);
    });
  }

  void _handleGoogle() {
    // TODO: Google sign-in integration
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),

                // ── Logo ──────────────────────────────────────────
                Center(
                  child: Image.asset(
                    'assets/brand/agrismart_logo.png',
                    height: 64,
                    fit: BoxFit.contain,
                  ),
                ),

                const SizedBox(height: 36),

                // ── Heading ───────────────────────────────────────
                Text(
                  'Welcome back',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  'Sign in to your AgriSmart account',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppTheme.textMuted,
                  ),
                ),

                const SizedBox(height: 32),

                // ── Error message ─────────────────────────────────
                if (_errorMessage != null) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: Color(0xFFDC2626),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Email ─────────────────────────────────────────
                AgriTextField(
                  label: 'Email address',
                  hint: 'you@example.com',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(
                    Icons.mail_outline_rounded,
                    size: 20,
                    color: AppTheme.textMuted,
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Email is required';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // ── Password ──────────────────────────────────────
                AgriTextField(
                  label: 'Password',
                  hint: '••••••••',
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  prefixIcon: const Icon(
                    Icons.lock_outline_rounded,
                    size: 20,
                    color: AppTheme.textMuted,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 20,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    return null;
                  },
                ),

                const SizedBox(height: 12),

                // ── Forgot password ───────────────────────────────
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pushNamed(
                      ForgotPasswordScreen.routeName,
                    ),
                    child: const Text('Forgot password?'),
                  ),
                ),

                const SizedBox(height: 8),

                // ── Login button ──────────────────────────────────
                AgriPrimaryButton(
                  label: 'Sign In',
                  onPressed: _handleLogin,
                  loading: _loading,
                  icon: Icons.arrow_forward_rounded,
                ),

                const SizedBox(height: 20),

                // ── Divider ───────────────────────────────────────
                const AgriDivider(),

                const SizedBox(height: 20),

                // ── Google ────────────────────────────────────────
                AgriGoogleButton(onPressed: _handleGoogle),

                const SizedBox(height: 32),

                // ── Register link ─────────────────────────────────
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      TextButton(
                        onPressed: () => Navigator.of(context).pushNamed(
                          RegistrationPathScreen.routeName,
                        ),
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Register',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


class _DevUser {
  const _DevUser(this.password, this.role);
  final String password;
  final String role;
}
