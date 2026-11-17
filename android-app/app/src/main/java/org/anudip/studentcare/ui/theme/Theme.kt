package org.anudip.studentcare.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val AnudipTealPrimary = Color(0xFF007E8A)
val AnudipTealDark = Color(0xFF005F69)
val AnudipNavy = Color(0xFF0F3D5E)
val AnudipMintContainer = Color(0xFFE2F5F7)
val AnudipGoldAccent = Color(0xFFF5B041)
val AnudipSurface = Color(0xFFFFFFFF)
val AnudipBackground = Color(0xFFF5F9FA)
val AnudipOutline = Color(0xFFD5E1E4)
val AnudipCharcoal = Color(0xFF232B2E)
val AnudipMuted = Color(0xFF5C6B73)
val AnudipErrorBg = Color(0xFFFDF2F2)
val AnudipErrorText = Color(0xFFB91C1C)
val AnudipSuccessBg = Color(0xFFECFDF5)
val AnudipSuccessText = Color(0xFF065F46)

private val LightColorScheme = lightColorScheme(
    primary = AnudipTealPrimary,
    onPrimary = Color.White,
    primaryContainer = AnudipMintContainer,
    onPrimaryContainer = AnudipTealDark,
    secondary = AnudipNavy,
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE6EEF6),
    onSecondaryContainer = AnudipNavy,
    tertiary = AnudipGoldAccent,
    onTertiary = AnudipCharcoal,
    background = AnudipBackground,
    onBackground = AnudipCharcoal,
    surface = AnudipSurface,
    onSurface = AnudipCharcoal,
    surfaceVariant = Color(0xFFEEF4F6),
    onSurfaceVariant = AnudipMuted,
    outline = AnudipOutline,
    error = AnudipErrorText,
    onError = Color.White,
    errorContainer = AnudipErrorBg,
    onErrorContainer = AnudipErrorText
)

private val AnudipTypography = Typography(
    headlineMedium = TextStyle(
        fontSize = 24.sp,
        lineHeight = 32.sp,
        fontWeight = FontWeight.Bold,
        color = AnudipTealPrimary
    ),
    titleLarge = TextStyle(
        fontSize = 20.sp,
        lineHeight = 28.sp,
        fontWeight = FontWeight.Bold,
        color = AnudipCharcoal
    ),
    titleMedium = TextStyle(
        fontSize = 16.sp,
        lineHeight = 22.sp,
        fontWeight = FontWeight.SemiBold,
        color = AnudipCharcoal
    ),
    bodyLarge = TextStyle(
        fontSize = 15.sp,
        lineHeight = 22.sp,
        fontWeight = FontWeight.Normal,
        color = AnudipCharcoal
    ),
    bodyMedium = TextStyle(
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.Normal,
        color = AnudipMuted
    ),
    labelLarge = TextStyle(
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.SemiBold
    )
)

private val AnudipShapes = Shapes(
    small = RoundedCornerShape(10.dp),
    medium = RoundedCornerShape(14.dp),
    large = RoundedCornerShape(18.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

@Composable
fun AnudipStudentCareTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = AnudipTypography,
        shapes = AnudipShapes,
        content = content
    )
}
