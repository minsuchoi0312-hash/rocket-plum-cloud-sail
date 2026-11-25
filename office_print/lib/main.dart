import 'package:material_ui/material_ui.dart';
import 'package:pdfrx/pdfrx.dart';

import 'ui/office_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await pdfrxFlutterInitialize();
  runApp(const OfficePrintApp());
}
