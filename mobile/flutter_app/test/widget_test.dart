import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:crop_conduit_flutter/main.dart';

void main() {
  testWidgets('AgriSmart app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AgriSmartApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
