# Retrofit & OkHttp
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-dontwarn retrofit2.**
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Gson data models
-keep class org.anudip.studentcare.data.model.** { *; }

# Keep Kotlin Serialization & Coroutines
-keepclassmembers class kotlinx.coroutines.** { *; }
