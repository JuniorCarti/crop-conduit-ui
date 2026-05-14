import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/splash_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/registration_path_screen.dart';
import 'screens/auth/farmer/farmer_registration_screen.dart';
import 'screens/auth/buyer/buyer_registration_screen.dart';
import 'screens/auth/transport/transport_registration_screen.dart';
import 'screens/farmer/farmer_shell.dart';
import 'screens/buyer/buyer_shell.dart';
import 'screens/transport/transport_shell.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const AgriSmartApp());
}

class AgriSmartApp extends StatelessWidget {
  const AgriSmartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriSmart Kenya',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
      routes: {
        // ── Onboarding ──────────────────────────────────────────
        OnboardingScreen.routeName: (_) => const OnboardingScreen(),

        // ── Auth ────────────────────────────────────────────────
        LoginScreen.routeName: (_) => const LoginScreen(),
        RegistrationPathScreen.routeName: (_) => const RegistrationPathScreen(),

        // ── Registration ────────────────────────────────────────
        FarmerRegistrationScreen.routeName: (_) =>
            const FarmerRegistrationScreen(),
        BuyerRegistrationScreen.routeName: (_) =>
            const BuyerRegistrationScreen(),
        TransportRegistrationScreen.routeName: (_) =>
            const TransportRegistrationScreen(),

        // ── Dashboard Shells ────────────────────────────────────
        FarmerShell.routeName: (_) => const FarmerShell(),
        BuyerShell.routeName: (_) => const BuyerShell(),
        TransportShell.routeName: (_) => const TransportShell(),
      },
    );
  }
}
