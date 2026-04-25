import 'package:flutter_test/flutter_test.dart';

import 'package:crop_conduit_flutter/main.dart';

void main() {
  testWidgets('App boots to splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const CropConduitApp());
    expect(find.text('Crop Conduit'), findsOneWidget);
  });
}
