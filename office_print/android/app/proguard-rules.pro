# Release minify is off. These rules are here so turning R8 on later
# does not strip the USB/share MethodChannel or Flutter embedding.
-keep class com.officeprint.office_print.MainActivity { *; }
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugin.common.** { *; }
-keepclassmembers class * {
    @io.flutter.plugin.common.MethodChannel <methods>;
}
-keep class android.net.nsd.** { *; }
-dontwarn jp.espresso.pdfrx.**
