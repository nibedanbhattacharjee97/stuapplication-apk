package org.anudip.studentcare.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import org.anudip.studentcare.ui.components.AnudipCaresBannerCard
import org.anudip.studentcare.ui.components.OfflineStatusBanner
import org.anudip.studentcare.ui.theme.AnudipBackground
import org.anudip.studentcare.ui.theme.AnudipMintContainer
import org.anudip.studentcare.ui.theme.AnudipNavy
import org.anudip.studentcare.ui.theme.AnudipOutline
import org.anudip.studentcare.ui.theme.AnudipTealPrimary

@Composable
fun RoleSelectionScreen(
    isConnected: Boolean,
    onNewStudentClick: () -> Unit,
    onExistingStudentClick: () -> Unit
) {
    Scaffold(
        containerColor = AnudipBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            OfflineStatusBanner(isConnected = isConnected)

            Spacer(modifier = Modifier.height(12.dp))

            AnudipCaresBannerCard()

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "Welcome To Anudip Student Bot",
                style = MaterialTheme.typography.headlineMedium,
                color = AnudipTealPrimary,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Please tell us who you are to continue",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            RoleSelectionCard(
                emoji = "🧑‍🎓",
                title = "New Student",
                subtitle = "Register your details & pin code to get started",
                icon = Icons.Default.PersonAdd,
                accentColor = AnudipTealPrimary,
                containerColor = AnudipMintContainer,
                onClick = onNewStudentClick
            )

            Spacer(modifier = Modifier.height(14.dp))

            RoleSelectionCard(
                emoji = "🎓",
                title = "Existing Student",
                subtitle = "Verify with your Name & Anudip Student ID (AF0...)",
                icon = Icons.Default.School,
                accentColor = AnudipNavy,
                containerColor = Color(0xFFE6EEF6),
                onClick = onExistingStudentClick
            )

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "Anudip Foundation • Student Care Portal",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun RoleSelectionCard(
    emoji: String,
    title: String,
    subtitle: String,
    icon: ImageVector,
    accentColor: Color,
    containerColor: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, AnudipOutline),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = containerColor,
                    modifier = Modifier.size(48.dp)
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column {
                    Text(
                        text = "$emoji $title",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = accentColor
            )
        }
    }
}
