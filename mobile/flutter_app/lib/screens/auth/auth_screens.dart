import 'package:crop_conduit_flutter/theme/app_theme.dart';
import 'package:crop_conduit_flutter/widgets/auth_shell.dart';
import 'package:crop_conduit_flutter/widgets/brand_header.dart';
import 'package:flutter/material.dart';

enum UserRole { farmer, buyer, driver }

extension UserRoleUi on UserRole {
  String get label {
    switch (this) {
      case UserRole.farmer:
        return 'Farmer';
      case UserRole.buyer:
        return 'Buyer';
      case UserRole.driver:
        return 'Driver';
    }
  }

  String get subtitle {
    switch (this) {
      case UserRole.farmer:
        return 'Manage harvest, stock, and farm sales.';
      case UserRole.buyer:
        return 'Source produce directly from trusted farms.';
      case UserRole.driver:
        return 'Handle deliveries and route updates efficiently.';
    }
  }

  List<String> get highlights {
    switch (this) {
      case UserRole.farmer:
        return ['Harvest lists', 'Market pricing', 'Field records'];
      case UserRole.buyer:
        return ['Supplier network', 'Trade contracts', 'Quality control'];
      case UserRole.driver:
        return ['Route updates', 'Pickup jobs', 'Delivery proof'];
    }
  }

  IconData get icon {
    switch (this) {
      case UserRole.farmer:
        return Icons.agriculture_rounded;
      case UserRole.buyer:
        return Icons.store_rounded;
      case UserRole.driver:
        return Icons.local_shipping_rounded;
    }
  }

  Color get color {
    switch (this) {
      case UserRole.farmer:
        return const Color(0xFF0F7A36);
      case UserRole.buyer:
        return const Color(0xFFEA580C);
      case UserRole.driver:
        return const Color(0xFF1D4ED8);
    }
  }
}

class AuthLandingScreen extends StatelessWidget {
  const AuthLandingScreen({super.key});

  static const routeName = '/auth';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const AuthBackdrop(
            primaryColor: AppTheme.primary,
            secondaryColor: AppTheme.secondary,
            tertiaryColor: Color(0xFF2563EB),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 720),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const AuthPill(
                        icon: Icons.verified_user_rounded,
                        label: 'Secure access',
                        color: AppTheme.primary,
                        filled: true,
                      ),
                      const SizedBox(height: 16),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.all(22),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.12),
                            Colors.white,
                            AppTheme.secondary.withValues(alpha: 0.06),
                          ],
                        ),
                        borderColor: AppTheme.primary.withValues(alpha: 0.12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const BrandHeader(
                              subtitle:
                                  'Choose how you want to access Crop Conduit.',
                              center: true,
                              logoHeight: 72,
                            ),
                            const SizedBox(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                AuthPill(
                                  icon: Icons.lock_rounded,
                                  label: 'Fast sign in',
                                  color: AppTheme.primary,
                                ),
                                SizedBox(width: 10),
                                AuthPill(
                                  icon: Icons.person_add_alt_1_rounded,
                                  label: 'New accounts',
                                  color: AppTheme.secondary,
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'A polished entry point for farmers, buyers, and drivers.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyLarge
                                  ?.copyWith(
                                    color: AppTheme.textMuted,
                                    height: 1.45,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      const AuthSectionHeader(
                        eyebrow: 'Get started',
                        title: 'Choose your path',
                        subtitle:
                            'Jump straight into your account or create a new one in a few taps.',
                      ),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isWide = constraints.maxWidth > 560;
                          final loginCard = _AuthActionCard(
                            title: 'General Login',
                            subtitle:
                                'Sign in to your existing account and keep moving.',
                            actionText: 'Login',
                            icon: Icons.login_rounded,
                            accentColor: AppTheme.primary,
                            onPressed: () => Navigator.of(
                              context,
                            ).pushNamed(GeneralLoginScreen.routeName),
                          );
                          final signupCard = _AuthActionCard(
                            title: 'General Sign Up',
                            subtitle:
                                'Create a new Crop Conduit account in minutes.',
                            actionText: 'Sign Up',
                            icon: Icons.person_add_alt_1_rounded,
                            accentColor: AppTheme.secondary,
                            onPressed: () => Navigator.of(
                              context,
                            ).pushNamed(GeneralSignupScreen.routeName),
                          );

                          if (isWide) {
                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: loginCard),
                                const SizedBox(width: 12),
                                Expanded(child: signupCard),
                              ],
                            );
                          }

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              loginCard,
                              const SizedBox(height: 12),
                              signupCard,
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 26),
                      const AuthSectionHeader(
                        eyebrow: 'Role-based access',
                        title: 'Open the right workspace',
                        subtitle:
                            'Choose the dashboard that matches how you work today.',
                      ),
                      const SizedBox(height: 14),
                      _RoleEntryCard(
                        role: UserRole.farmer,
                        routeName: FarmerAuthScreen.routeName,
                      ),
                      const SizedBox(height: 12),
                      _RoleEntryCard(
                        role: UserRole.buyer,
                        routeName: BuyerAuthScreen.routeName,
                      ),
                      const SizedBox(height: 12),
                      _RoleEntryCard(
                        role: UserRole.driver,
                        routeName: DriverAuthScreen.routeName,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class GeneralLoginScreen extends StatelessWidget {
  const GeneralLoginScreen({super.key});
  static const routeName = '/login';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Welcome back',
      subtitle:
          'Sign in to continue managing your farm network with a polished, mobile-ready workspace.',
      buttonLabel: 'Login',
      includeName: false,
      accentColor: AppTheme.primary,
      heroLabel: 'Secure login',
      heroIcon: Icons.lock_rounded,
      highlights: ['Fast sign in', 'Secure access', 'Role aware'],
      footerText: 'No account yet?',
      footerAction: 'Sign up',
      footerRoute: GeneralSignupScreen.routeName,
    );
  }
}

class GeneralSignupScreen extends StatelessWidget {
  const GeneralSignupScreen({super.key});
  static const routeName = '/signup';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Create your account',
      subtitle:
          'Set up your Crop Conduit profile and start using the platform in minutes.',
      buttonLabel: 'Sign Up',
      includeName: true,
      accentColor: AppTheme.secondary,
      heroLabel: 'Create profile',
      heroIcon: Icons.person_add_alt_1_rounded,
      highlights: ['Quick setup', 'Role selection', 'Mobile ready'],
      footerText: 'Already registered?',
      footerAction: 'Login',
      footerRoute: GeneralLoginScreen.routeName,
    );
  }
}

class FarmerAuthScreen extends StatelessWidget {
  const FarmerAuthScreen({super.key});
  static const routeName = '/farmer/auth';

  @override
  Widget build(BuildContext context) {
    return const RoleAuthOptionScreen(
      role: UserRole.farmer,
      loginRoute: FarmerLoginScreen.routeName,
      signupRoute: FarmerSignupScreen.routeName,
    );
  }
}

class BuyerAuthScreen extends StatelessWidget {
  const BuyerAuthScreen({super.key});
  static const routeName = '/buyer/auth';

  @override
  Widget build(BuildContext context) {
    return const RoleAuthOptionScreen(
      role: UserRole.buyer,
      loginRoute: BuyerLoginScreen.routeName,
      signupRoute: BuyerSignupScreen.routeName,
    );
  }
}

class DriverAuthScreen extends StatelessWidget {
  const DriverAuthScreen({super.key});
  static const routeName = '/driver/auth';

  @override
  Widget build(BuildContext context) {
    return const RoleAuthOptionScreen(
      role: UserRole.driver,
      loginRoute: DriverLoginScreen.routeName,
      signupRoute: DriverSignupScreen.routeName,
    );
  }
}

class FarmerLoginScreen extends StatelessWidget {
  const FarmerLoginScreen({super.key});
  static const routeName = '/farmer/login';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Farmer Login',
      subtitle: 'Access your harvest dashboard, sales tools, and farm records.',
      buttonLabel: 'Login as Farmer',
      includeName: false,
      accentColor: Color(0xFF0F7A36),
      heroLabel: 'Farmer workspace',
      heroIcon: Icons.agriculture_rounded,
      highlights: ['Harvest lists', 'Market pricing', 'Field records'],
      footerText: 'Need a farmer account?',
      footerAction: 'Sign up',
      footerRoute: FarmerSignupScreen.routeName,
    );
  }
}

class FarmerSignupScreen extends StatelessWidget {
  const FarmerSignupScreen({super.key});
  static const routeName = '/farmer/signup';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Farmer Sign Up',
      subtitle:
          'Create your farmer profile and start selling with a polished setup.',
      buttonLabel: 'Create Farmer Account',
      includeName: true,
      accentColor: Color(0xFF0F7A36),
      heroLabel: 'Farmer profile',
      heroIcon: Icons.agriculture_rounded,
      highlights: ['Quick registration', 'Crop listings', 'Trade readiness'],
      footerText: 'Already a farmer user?',
      footerAction: 'Login',
      footerRoute: FarmerLoginScreen.routeName,
    );
  }
}

class BuyerLoginScreen extends StatelessWidget {
  const BuyerLoginScreen({super.key});
  static const routeName = '/buyer/login';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Buyer Login',
      subtitle:
          'Sign in to source produce, place orders, and manage supplier relationships.',
      buttonLabel: 'Login as Buyer',
      includeName: false,
      accentColor: Color(0xFFEA580C),
      heroLabel: 'Buyer workspace',
      heroIcon: Icons.store_rounded,
      highlights: ['Supplier network', 'Order flow', 'Quality control'],
      footerText: 'No buyer account?',
      footerAction: 'Sign up',
      footerRoute: BuyerSignupScreen.routeName,
    );
  }
}

class BuyerSignupScreen extends StatelessWidget {
  const BuyerSignupScreen({super.key});
  static const routeName = '/buyer/signup';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Buyer Sign Up',
      subtitle:
          'Create a buyer profile and unlock fast sourcing from trusted farms.',
      buttonLabel: 'Create Buyer Account',
      includeName: true,
      accentColor: Color(0xFFEA580C),
      heroLabel: 'Buyer profile',
      heroIcon: Icons.store_rounded,
      highlights: ['Bulk sourcing', 'Trade documents', 'Dispatch tracking'],
      footerText: 'Already a buyer?',
      footerAction: 'Login',
      footerRoute: BuyerLoginScreen.routeName,
    );
  }
}

class DriverLoginScreen extends StatelessWidget {
  const DriverLoginScreen({super.key});
  static const routeName = '/driver/login';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Driver Login',
      subtitle:
          'Track assignments, update deliveries, and stay on top of route changes.',
      buttonLabel: 'Login as Driver',
      includeName: false,
      accentColor: Color(0xFF1D4ED8),
      heroLabel: 'Driver workspace',
      heroIcon: Icons.local_shipping_rounded,
      highlights: ['Route updates', 'Pickup jobs', 'Delivery proof'],
      footerText: 'Need a driver account?',
      footerAction: 'Sign up',
      footerRoute: DriverSignupScreen.routeName,
    );
  }
}

class DriverSignupScreen extends StatelessWidget {
  const DriverSignupScreen({super.key});
  static const routeName = '/driver/signup';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Driver Sign Up',
      subtitle:
          'Create your driver profile and receive delivery tasks quickly.',
      buttonLabel: 'Create Driver Account',
      includeName: true,
      accentColor: Color(0xFF1D4ED8),
      heroLabel: 'Driver profile',
      heroIcon: Icons.local_shipping_rounded,
      highlights: ['Dispatch ready', 'Live routing', 'Proof of delivery'],
      footerText: 'Already driving with us?',
      footerAction: 'Login',
      footerRoute: DriverLoginScreen.routeName,
    );
  }
}

class RoleAuthOptionScreen extends StatelessWidget {
  const RoleAuthOptionScreen({
    super.key,
    required this.role,
    required this.loginRoute,
    required this.signupRoute,
  });

  final UserRole role;
  final String loginRoute;
  final String signupRoute;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          AuthBackdrop(
            primaryColor: role.color,
            secondaryColor: role.color == AppTheme.primary
                ? AppTheme.secondary
                : role.color,
            tertiaryColor: const Color(0xFF2563EB),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).maybePop(),
                            icon: const Icon(Icons.arrow_back_rounded),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.88,
                              ),
                            ),
                          ),
                          const Spacer(),
                          AuthPill(
                            icon: role.icon,
                            label: '${role.label} access',
                            color: role.color,
                            filled: true,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.all(22),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            role.color.withValues(alpha: 0.14),
                            Colors.white,
                            role.color.withValues(alpha: 0.06),
                          ],
                        ),
                        borderColor: role.color.withValues(alpha: 0.14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: role.color.withValues(alpha: 0.12),
                                  ),
                                  child: Icon(role.icon, color: role.color),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${role.label} workspace',
                                        style: Theme.of(
                                          context,
                                        ).textTheme.titleLarge,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        role.subtitle,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(
                                              color: AppTheme.textMuted,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: role.highlights
                                  .map(
                                    (highlight) => AuthPill(
                                      icon: Icons.check_rounded,
                                      label: highlight,
                                      color: role.color,
                                      filled: true,
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            ElevatedButton.icon(
                              onPressed: () =>
                                  Navigator.of(context).pushNamed(loginRoute),
                              icon: const Icon(Icons.login_rounded),
                              label: Text('Login as ${role.label}'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: role.color,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: () =>
                                  Navigator.of(context).pushNamed(signupRoute),
                              icon: const Icon(Icons.person_add_alt_1_rounded),
                              label: Text('Sign up as ${role.label}'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: role.color,
                                side: BorderSide(
                                  color: role.color.withValues(alpha: 0.18),
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'You can move between login and sign up at any time without losing your place.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodyMedium
                                  ?.copyWith(color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AuthFormScreen extends StatefulWidget {
  const AuthFormScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.includeName,
    required this.accentColor,
    required this.heroLabel,
    required this.heroIcon,
    required this.highlights,
    required this.footerText,
    required this.footerAction,
    required this.footerRoute,
  });

  final String title;
  final String subtitle;
  final String buttonLabel;
  final bool includeName;
  final Color accentColor;
  final String heroLabel;
  final IconData heroIcon;
  final List<String> highlights;
  final String footerText;
  final String footerAction;
  final String footerRoute;

  @override
  State<AuthFormScreen> createState() => _AuthFormScreenState();
}

class _AuthFormScreenState extends State<AuthFormScreen> {
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          AuthBackdrop(
            primaryColor: widget.accentColor,
            secondaryColor: widget.accentColor == AppTheme.primary
                ? AppTheme.secondary
                : AppTheme.primary,
            tertiaryColor: const Color(0xFF2563EB),
          ),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).maybePop(),
                            icon: const Icon(Icons.arrow_back_rounded),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.88,
                              ),
                            ),
                          ),
                          const Spacer(),
                          AuthPill(
                            icon: widget.heroIcon,
                            label: widget.heroLabel,
                            color: widget.accentColor,
                            filled: true,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.all(22),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            widget.accentColor.withValues(alpha: 0.15),
                            Colors.white,
                            widget.accentColor.withValues(alpha: 0.05),
                          ],
                        ),
                        borderColor: widget.accentColor.withValues(alpha: 0.14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 56,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: widget.accentColor.withValues(
                                      alpha: 0.12,
                                    ),
                                  ),
                                  child: Icon(
                                    widget.heroIcon,
                                    color: widget.accentColor,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        widget.title,
                                        style: Theme.of(
                                          context,
                                        ).textTheme.headlineSmall,
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        widget.subtitle,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium
                                            ?.copyWith(
                                              color: AppTheme.textMuted,
                                              height: 1.45,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 18),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: widget.highlights
                                  .map(
                                    (highlight) => AuthPill(
                                      icon: Icons.check_rounded,
                                      label: highlight,
                                      color: widget.accentColor,
                                      filled: true,
                                    ),
                                  )
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            if (widget.includeName) ...[
                              _AuthTextField(
                                label: 'Full name',
                                icon: Icons.badge_outlined,
                                accentColor: widget.accentColor,
                                textCapitalization: TextCapitalization.words,
                              ),
                              const SizedBox(height: 12),
                            ],
                            _AuthTextField(
                              label: 'Email address',
                              icon: Icons.mail_outline_rounded,
                              accentColor: widget.accentColor,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 12),
                            _AuthTextField(
                              label: 'Password',
                              icon: Icons.lock_outline_rounded,
                              accentColor: widget.accentColor,
                              obscureText: _obscurePassword,
                              suffixIcon: IconButton(
                                onPressed: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_outlined
                                      : Icons.visibility_off_outlined,
                                ),
                                color: widget.accentColor,
                              ),
                            ),
                            if (widget.includeName) ...[
                              const SizedBox(height: 12),
                              _AuthTextField(
                                label: 'Confirm password',
                                icon: Icons.verified_outlined,
                                accentColor: widget.accentColor,
                                obscureText: _obscureConfirmPassword,
                                suffixIcon: IconButton(
                                  onPressed: () {
                                    setState(() {
                                      _obscureConfirmPassword =
                                          !_obscureConfirmPassword;
                                    });
                                  },
                                  icon: Icon(
                                    _obscureConfirmPassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                  ),
                                  color: widget.accentColor,
                                ),
                              ),
                            ],
                            const SizedBox(height: 18),
                            ElevatedButton(
                              onPressed: () {},
                              style: ElevatedButton.styleFrom(
                                backgroundColor: widget.accentColor,
                                foregroundColor: Colors.white,
                              ),
                              child: Text(widget.buttonLabel),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'By continuing, you agree to keep your account details secure and accurate.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      AuthSurfaceCard(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 16,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              widget.footerText,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                            TextButton(
                              onPressed: () => Navigator.of(
                                context,
                              ).pushReplacementNamed(widget.footerRoute),
                              child: Text(widget.footerAction),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.label,
    required this.icon,
    required this.accentColor,
    this.obscureText = false,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.suffixIcon,
  });

  final String label;
  final IconData icon;
  final Color accentColor;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      obscureText: obscureText,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: accentColor),
        suffixIcon: suffixIcon,
      ),
    );
  }
}

class _RoleEntryCard extends StatelessWidget {
  const _RoleEntryCard({required this.role, required this.routeName});

  final UserRole role;
  final String routeName;

  @override
  Widget build(BuildContext context) {
    return AuthSurfaceCard(
      onTap: () => Navigator.of(context).pushNamed(routeName),
      padding: const EdgeInsets.all(16),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          role.color.withValues(alpha: 0.12),
          Colors.white,
          role.color.withValues(alpha: 0.05),
        ],
      ),
      borderColor: role.color.withValues(alpha: 0.14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: role.color.withValues(alpha: 0.12),
                ),
                child: Icon(role.icon, color: role.color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      role.label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      role.subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: role.color),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: role.highlights
                .map(
                  (highlight) => AuthPill(
                    icon: Icons.check_rounded,
                    label: highlight,
                    color: role.color,
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _AuthActionCard extends StatelessWidget {
  const _AuthActionCard({
    required this.title,
    required this.subtitle,
    required this.actionText,
    required this.icon,
    required this.accentColor,
    required this.onPressed,
  });

  final String title;
  final String subtitle;
  final String actionText;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return AuthSurfaceCard(
      padding: const EdgeInsets.all(16),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          accentColor.withValues(alpha: 0.12),
          Colors.white,
          accentColor.withValues(alpha: 0.04),
        ],
      ),
      borderColor: accentColor.withValues(alpha: 0.14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accentColor.withValues(alpha: 0.12),
                ),
                child: Icon(icon, color: accentColor),
              ),
              const Spacer(),
              Icon(Icons.arrow_forward_rounded, color: accentColor),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            title,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: accentColor,
                foregroundColor: Colors.white,
              ),
              child: Text(actionText),
            ),
          ),
        ],
      ),
    );
  }
}
