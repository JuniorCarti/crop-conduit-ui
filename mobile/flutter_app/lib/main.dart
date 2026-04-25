import 'package:crop_conduit_flutter/screens/auth/auth_screens.dart';
import 'package:crop_conduit_flutter/screens/onboarding_screen.dart';
import 'package:crop_conduit_flutter/screens/splash_screen.dart';
import 'package:crop_conduit_flutter/theme/app_theme.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(const CropConduitApp());
}

class CropConduitApp extends StatelessWidget {
  const CropConduitApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Crop Conduit',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
      routes: {
        OnboardingScreen.routeName: (_) => const OnboardingScreen(),
        AuthLandingScreen.routeName: (_) => const AuthLandingScreen(),
        GeneralLoginScreen.routeName: (_) => const GeneralLoginScreen(),
        GeneralSignupScreen.routeName: (_) => const GeneralSignupScreen(),
        FarmerAuthScreen.routeName: (_) => const FarmerAuthScreen(),
        FarmerLoginScreen.routeName: (_) => const FarmerLoginScreen(),
        FarmerSignupScreen.routeName: (_) => const FarmerSignupScreen(),
        BuyerAuthScreen.routeName: (_) => const BuyerAuthScreen(),
        BuyerLoginScreen.routeName: (_) => const BuyerLoginScreen(),
        BuyerSignupScreen.routeName: (_) => const BuyerSignupScreen(),
        DriverAuthScreen.routeName: (_) => const DriverAuthScreen(),
        DriverLoginScreen.routeName: (_) => const DriverLoginScreen(),
        DriverSignupScreen.routeName: (_) => const DriverSignupScreen(),
      },
    );
  }
}
