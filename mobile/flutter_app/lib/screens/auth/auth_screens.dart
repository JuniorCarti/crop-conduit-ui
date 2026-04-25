import 'package:crop_conduit_flutter/theme/app_theme.dart';
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
        return const Color(0xFF2E7D32);
      case UserRole.buyer:
        return const Color(0xFFE65100);
      case UserRole.driver:
        return const Color(0xFF1565C0);
    }
  }
}

class AuthLandingScreen extends StatelessWidget {
  const AuthLandingScreen({super.key});

  static const routeName = '/auth';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const BrandHeader(
                subtitle: 'Choose how you want to access Crop Conduit.',
              ),
              const SizedBox(height: 24),
              _AuthActionCard(
                title: 'General Login',
                subtitle: 'Sign in to your existing account',
                actionText: 'Login',
                onPressed: () => Navigator.of(
                  context,
                ).pushNamed(GeneralLoginScreen.routeName),
              ),
              const SizedBox(height: 12),
              _AuthActionCard(
                title: 'General Sign Up',
                subtitle: 'Create a new Crop Conduit account',
                actionText: 'Sign Up',
                onPressed: () => Navigator.of(
                  context,
                ).pushNamed(GeneralSignupScreen.routeName),
              ),
              const SizedBox(height: 24),
              Text(
                'Role-specific access',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView(
                  children: const [
                    _RoleEntryCard(
                      role: UserRole.farmer,
                      routeName: FarmerAuthScreen.routeName,
                    ),
                    SizedBox(height: 10),
                    _RoleEntryCard(
                      role: UserRole.buyer,
                      routeName: BuyerAuthScreen.routeName,
                    ),
                    SizedBox(height: 10),
                    _RoleEntryCard(
                      role: UserRole.driver,
                      routeName: DriverAuthScreen.routeName,
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

class GeneralLoginScreen extends StatelessWidget {
  const GeneralLoginScreen({super.key});
  static const routeName = '/login';

  @override
  Widget build(BuildContext context) {
    return const AuthFormScreen(
      title: 'Welcome back',
      subtitle: 'Login to continue.',
      buttonLabel: 'Login',
      includeName: false,
      accentColor: AppTheme.primary,
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
      subtitle: 'Set up your Crop Conduit profile.',
      buttonLabel: 'Sign Up',
      includeName: true,
      accentColor: AppTheme.secondary,
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
      subtitle: 'Access your farm dashboard and produce listings.',
      buttonLabel: 'Login as Farmer',
      includeName: false,
      accentColor: Color(0xFF2E7D32),
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
      subtitle: 'Create your farmer profile and start selling.',
      buttonLabel: 'Create Farmer Account',
      includeName: true,
      accentColor: Color(0xFF2E7D32),
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
      subtitle: 'Sign in to browse produce and place orders.',
      buttonLabel: 'Login as Buyer',
      includeName: false,
      accentColor: Color(0xFFE65100),
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
      subtitle: 'Create a buyer profile to source produce quickly.',
      buttonLabel: 'Create Buyer Account',
      includeName: true,
      accentColor: Color(0xFFE65100),
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
      subtitle: 'Track assignments and update deliveries.',
      buttonLabel: 'Login as Driver',
      includeName: false,
      accentColor: Color(0xFF1565C0),
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
      subtitle: 'Create your driver profile and receive delivery tasks.',
      buttonLabel: 'Create Driver Account',
      includeName: true,
      accentColor: Color(0xFF1565C0),
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
      appBar: AppBar(title: Text('${role.label} Access')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BrandHeader(subtitle: role.subtitle),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: role.color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: role.color.withValues(alpha: 0.2),
                    child: Icon(role.icon, color: role.color),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Continue as ${role.label} to use role-specific tools.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pushNamed(loginRoute),
              style: ElevatedButton.styleFrom(
                backgroundColor: role.color,
                foregroundColor: Colors.white,
              ),
              child: Text('Login as ${role.label}'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pushNamed(signupRoute),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                side: BorderSide(color: role.color),
                foregroundColor: role.color,
              ),
              child: Text('Sign up as ${role.label}'),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthFormScreen extends StatelessWidget {
  const AuthFormScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.includeName,
    required this.accentColor,
    required this.footerText,
    required this.footerAction,
    required this.footerRoute,
  });

  final String title;
  final String subtitle;
  final String buttonLabel;
  final bool includeName;
  final Color accentColor;
  final String footerText;
  final String footerAction;
  final String footerRoute;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BrandHeader(subtitle: subtitle),
              const SizedBox(height: 18),
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 16),
              if (includeName) ...[
                const TextField(
                  decoration: InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: 12),
              ],
              const TextField(
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              const TextField(
                obscureText: true,
                decoration: InputDecoration(labelText: 'Password'),
              ),
              if (includeName) ...[
                const SizedBox(height: 12),
                const TextField(
                  obscureText: true,
                  decoration: InputDecoration(labelText: 'Confirm password'),
                ),
              ],
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: accentColor,
                  foregroundColor: Colors.white,
                ),
                child: Text(buttonLabel),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(footerText),
                  TextButton(
                    onPressed: () =>
                        Navigator.of(context).pushNamed(footerRoute),
                    child: Text(footerAction),
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

class _RoleEntryCard extends StatelessWidget {
  const _RoleEntryCard({required this.role, required this.routeName});

  final UserRole role;
  final String routeName;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () => Navigator.of(context).pushNamed(routeName),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: role.color.withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: role.color.withValues(alpha: 0.16),
              child: Icon(role.icon, color: role.color),
            ),
            const SizedBox(width: 12),
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
            Icon(Icons.arrow_forward_ios_rounded, size: 16, color: role.color),
          ],
        ),
      ),
    );
  }
}

class _AuthActionCard extends StatelessWidget {
  const _AuthActionCard({
    required this.title,
    required this.subtitle,
    required this.actionText,
    required this.onPressed,
  });

  final String title;
  final String subtitle;
  final String actionText;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(width: 14),
          FilledButton(onPressed: onPressed, child: Text(actionText)),
        ],
      ),
    );
  }
}
