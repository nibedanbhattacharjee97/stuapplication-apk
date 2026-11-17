package org.anudip.studentcare.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.RateReview
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.SupportAgent
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import org.anudip.studentcare.data.local.FaqCatalog
import org.anudip.studentcare.data.model.FaqItem
import org.anudip.studentcare.data.model.StudentSession
import org.anudip.studentcare.ui.components.AnudipCaresBannerCard
import org.anudip.studentcare.ui.components.ConfirmActionDialog
import org.anudip.studentcare.ui.components.ErrorMessageCard
import org.anudip.studentcare.ui.components.OfflineStatusBanner
import org.anudip.studentcare.ui.components.SuccessMessageCard
import org.anudip.studentcare.ui.theme.AnudipBackground
import org.anudip.studentcare.ui.theme.AnudipMintContainer
import org.anudip.studentcare.ui.theme.AnudipNavy
import org.anudip.studentcare.ui.theme.AnudipOutline
import org.anudip.studentcare.ui.theme.AnudipTealDark
import org.anudip.studentcare.ui.theme.AnudipTealPrimary
import org.anudip.studentcare.ui.viewmodel.DashboardUiState
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    session: StudentSession,
    uiState: DashboardUiState,
    isConnected: Boolean,
    onRefresh: () -> Unit,
    onSelectFaq: (FaqItem) -> Unit,
    onSelectLanguage: (String) -> Unit,
    onSubmitTicket: (String, String, ByteArray?, String?) -> Unit,
    onClearTicketStatus: () -> Unit,
    onSubmitAnotherEntry: () -> Unit,
    onChangeRoleLogout: () -> Unit
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    var showQuestionPicker by remember { mutableStateOf(false) }
    var showTicketDialog by remember { mutableStateOf(false) }
    var confirmAction by remember { mutableStateOf<ConfirmType?>(null) }

    Scaffold(
        containerColor = AnudipBackground,
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Anudip Student Bot",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = AnudipTealDark
                        )
                        Text(
                            text = buildSessionSubtitle(session),
                            style = MaterialTheme.typography.bodyMedium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
                actions = {
                    TextButton(onClick = { confirmAction = ConfirmType.SUBMIT_ANOTHER }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = AnudipTealPrimary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "New Entry",
                            color = AnudipTealPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    IconButton(onClick = { confirmAction = ConfirmType.CHANGE_ROLE_LOGOUT }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Logout,
                            contentDescription = "Change Role / Logout",
                            tint = AnudipNavy
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        PullToRefreshBox(
            isRefreshing = uiState.isRefreshing,
            onRefresh = onRefresh,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OfflineStatusBanner(isConnected = isConnected)

                AnudipCaresBannerCard()

                // Verified Student Session Strip
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = AnudipMintContainer,
                    border = BorderStroke(1.dp, AnudipTealPrimary.copy(alpha = 0.25f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "You selected: ${session.studentType.badge}",
                                style = MaterialTheme.typography.labelLarge,
                                color = AnudipTealDark
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = buildSessionDetails(session),
                                style = MaterialTheme.typography.bodyMedium,
                                color = AnudipTealDark.copy(alpha = 0.85f)
                            )
                        }
                        OutlinedButton(
                            onClick = { confirmAction = ConfirmType.SUBMIT_ANOTHER },
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, AnudipTealPrimary.copy(alpha = 0.4f)),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "⬅ Submit Another Entry",
                                style = MaterialTheme.typography.labelMedium,
                                color = AnudipTealDark
                            )
                        }
                    }
                }

                // Module 1: Ask Your Question & Get Answer in Your Own Language
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, AnudipOutline),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.QuestionAnswer,
                                contentDescription = null,
                                tint = AnudipTealPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Ask Your Question & Get Answer in Your Own Language",
                                style = MaterialTheme.typography.titleMedium,
                                color = AnudipTealPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "Select a question (${uiState.faqs.size} available)",
                            style = MaterialTheme.typography.labelLarge
                        )

                        Surface(
                            onClick = { showQuestionPicker = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            color = AnudipBackground,
                            border = BorderStroke(1.dp, AnudipOutline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 14.dp, vertical = 14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = uiState.selectedFaq.question,
                                    style = MaterialTheme.typography.bodyLarge,
                                    modifier = Modifier.weight(1f),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(
                                    imageVector = Icons.Default.ExpandMore,
                                    contentDescription = "Choose a question",
                                    tint = AnudipTealPrimary
                                )
                            }
                        }

                        HorizontalDivider(color = AnudipOutline)

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                text = "Question:",
                                style = MaterialTheme.typography.labelLarge,
                                color = AnudipNavy
                            )
                            Text(
                                text = uiState.selectedFaq.question,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )

                            Spacer(modifier = Modifier.height(4.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Answer:",
                                    style = MaterialTheme.typography.labelLarge,
                                    color = AnudipNavy
                                )
                                TextButton(
                                    onClick = {
                                        clipboardManager.setText(AnnotatedString(uiState.selectedFaq.answer))
                                        Toast.makeText(context, "Answer copied", Toast.LENGTH_SHORT).show()
                                    },
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.ContentCopy,
                                        contentDescription = null,
                                        modifier = Modifier.size(15.dp),
                                        tint = AnudipTealPrimary
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Copy", color = AnudipTealPrimary)
                                }
                            }
                            Text(
                                text = uiState.selectedFaq.answer,
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }

                // Module 2: Select Your Language
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, AnudipOutline),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Translate,
                                contentDescription = null,
                                tint = AnudipTealPrimary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Select Your Language",
                                style = MaterialTheme.typography.titleMedium,
                                color = AnudipTealPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "Choose language",
                            style = MaterialTheme.typography.labelLarge
                        )

                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(uiState.languages) { lang ->
                                val selected = lang == uiState.selectedLanguage
                                FilterChip(
                                    selected = selected,
                                    onClick = { onSelectLanguage(lang) },
                                    label = { Text(lang) },
                                    leadingIcon = if (selected) {
                                        {
                                            Icon(
                                                imageVector = Icons.Default.Check,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    } else null,
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = AnudipMintContainer,
                                        selectedLabelColor = AnudipTealDark,
                                        selectedLeadingIconColor = AnudipTealDark
                                    )
                                )
                            }
                        }

                        HorizontalDivider(color = AnudipOutline)

                        if (uiState.isTranslating) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.5.dp,
                                    color = AnudipTealPrimary
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Translating into ${uiState.selectedLanguage}...",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        } else if (!uiState.translationError.isNullOrBlank()) {
                            ErrorMessageCard(message = uiState.translationError)
                            OutlinedButton(
                                onClick = { onSelectLanguage(uiState.selectedLanguage) },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Retry Translation")
                            }
                        } else {
                            Text(
                                text = "Translated Question (${uiState.selectedLanguage}):",
                                style = MaterialTheme.typography.labelLarge,
                                color = AnudipNavy
                            )
                            Text(
                                text = uiState.translatedQuestion,
                                style = MaterialTheme.typography.bodyLarge,
                                fontWeight = FontWeight.Medium
                            )

                            Spacer(modifier = Modifier.height(2.dp))

                            Text(
                                text = "Translated Answer (${uiState.selectedLanguage}):",
                                style = MaterialTheme.typography.labelLarge,
                                color = AnudipNavy
                            )
                            Text(
                                text = uiState.translatedAnswer,
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    }
                }

                // Module 3: Contact Us via WhatsApp
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, AnudipOutline),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Contact Us via WhatsApp",
                            style = MaterialTheme.typography.titleMedium,
                            color = AnudipTealPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "WhatsApp In English",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        Button(
                            onClick = {
                                openWhatsAppChat(
                                    context = context,
                                    phone = uiState.whatsappPhone,
                                    message = uiState.whatsappDefaultMessage
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFF16A34A),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.Chat,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Chat on WhatsApp", fontWeight = FontWeight.SemiBold)
                        }
                        Text(
                            text = uiState.chatTiming,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }

                // Module 4: Student Review & Direct Support Channels (from FAQ #40 & #41)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = BorderStroke(1.dp, AnudipOutline),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Student Feedback & Support",
                            style = MaterialTheme.typography.titleMedium,
                            color = AnudipTealPrimary,
                            fontWeight = FontWeight.Bold
                        )

                        OutlinedButton(
                            onClick = { openExternalUrl(context, uiState.reviewUrl) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, AnudipOutline)
                        ) {
                            Icon(
                                imageVector = Icons.Default.RateReview,
                                contentDescription = null,
                                tint = AnudipTealPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("🌟 Click Here To Give A Review", color = AnudipNavy)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { dialNumber(context, FaqCatalog.HELPLINE_PHONE) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, AnudipOutline)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Call,
                                    contentDescription = null,
                                    tint = AnudipTealPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Helpline", maxLines = 1)
                            }
                            OutlinedButton(
                                onClick = { sendSupportEmail(context, FaqCatalog.SUPPORT_EMAIL, session) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(1.dp, AnudipOutline)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Email,
                                    contentDescription = null,
                                    tint = AnudipTealPrimary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Email Us", maxLines = 1)
                            }
                        }

                        Button(
                            onClick = {
                                onClearTicketStatus()
                                showTicketDialog = true
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = AnudipNavy,
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.SupportAgent,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Raise a Query / Attach Screenshot")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
            }
        }
    }

    if (showQuestionPicker) {
        QuestionPickerSheet(
            faqs = uiState.faqs,
            selectedFaq = uiState.selectedFaq,
            onSelect = { faq ->
                onSelectFaq(faq)
                showQuestionPicker = false
            },
            onDismiss = { showQuestionPicker = false }
        )
    }

    if (showTicketDialog) {
        SupportTicketDialog(
            isSubmitting = uiState.isSubmittingTicket,
            successMessage = uiState.ticketSuccessMessage,
            errorMessage = uiState.ticketErrorMessage,
            onSubmit = onSubmitTicket,
            onDismiss = { showTicketDialog = false }
        )
    }

    confirmAction?.let { action ->
        when (action) {
            ConfirmType.SUBMIT_ANOTHER -> {
                ConfirmActionDialog(
                    title = "Submit Another Entry?",
                    message = "This will return you to the student verification form so you can submit another entry.",
                    confirmLabel = "Continue",
                    onConfirm = {
                        confirmAction = null
                        onSubmitAnotherEntry()
                    },
                    onDismiss = { confirmAction = null }
                )
            }
            ConfirmType.CHANGE_ROLE_LOGOUT -> {
                ConfirmActionDialog(
                    title = "Log Out & Change Role?",
                    message = "Your current session will be cleared and you will return to the Welcome screen.",
                    confirmLabel = "Log Out",
                    onConfirm = {
                        confirmAction = null
                        onChangeRoleLogout()
                    },
                    onDismiss = { confirmAction = null }
                )
            }
        }
    }
}

private enum class ConfirmType {
    SUBMIT_ANOTHER,
    CHANGE_ROLE_LOGOUT
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuestionPickerSheet(
    faqs: List<FaqItem>,
    selectedFaq: FaqItem,
    onSelect: (FaqItem) -> Unit,
    onDismiss: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    val filtered = remember(faqs, searchQuery) {
        if (searchQuery.isBlank()) faqs
        else faqs.filter {
            it.question.contains(searchQuery, ignoreCase = true) ||
                it.answer.contains(searchQuery, ignoreCase = true)
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color.White
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp)
        ) {
            Text(
                text = "Select a question",
                style = MaterialTheme.typography.titleLarge,
                color = AnudipTealPrimary
            )
            Spacer(modifier = Modifier.height(10.dp))
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                placeholder = { Text("Search 41 student FAQs...") }
            )
            Spacer(modifier = Modifier.height(10.dp))

            if (filtered.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No matching questions found.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 460.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filtered, key = { it.index }) { item ->
                        val isSelected = item.index == selectedFaq.index
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelect(item) },
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) AnudipMintContainer else AnudipBackground,
                            border = BorderStroke(
                                1.dp,
                                if (isSelected) AnudipTealPrimary else AnudipOutline
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "${item.index}. ${item.question}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                                    modifier = Modifier.weight(1f)
                                )
                                if (isSelected) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = AnudipTealDark
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SupportTicketDialog(
    isSubmitting: Boolean,
    successMessage: String?,
    errorMessage: String?,
    onSubmit: (String, String, ByteArray?, String?) -> Unit,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var subject by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var attachmentLabel by remember { mutableStateOf<String?>(null) }
    var attachmentBytes by remember { mutableStateOf<ByteArray?>(null) }
    var attachmentMime by remember { mutableStateOf<String?>(null) }
    var pendingCameraUri by remember { mutableStateOf<Uri?>(null) }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri != null) {
            attachmentBytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            attachmentMime = context.contentResolver.getType(uri) ?: "image/jpeg"
            attachmentLabel = "Gallery image attached"
        }
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicture()
    ) { success ->
        val uri = pendingCameraUri
        if (success && uri != null) {
            attachmentBytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            attachmentMime = "image/jpeg"
            attachmentLabel = "Camera photo attached"
        }
    }

    fun launchCamera() {
        val dir = File(context.cacheDir, "camera_captures").apply { mkdirs() }
        val photoFile = File.createTempFile("ticket_", ".jpg", dir)
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            photoFile
        )
        pendingCameraUri = uri
        cameraLauncher.launch(uri)
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) launchCamera()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Raise a Query",
                style = MaterialTheme.typography.titleLarge,
                color = AnudipTealPrimary
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = subject,
                    onValueChange = { subject = it },
                    label = { Text("Subject") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("Describe your question or issue") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth()
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val granted = ContextCompat.checkSelfPermission(
                                context, Manifest.permission.CAMERA
                            ) == PackageManager.PERMISSION_GRANTED
                            if (granted) launchCamera()
                            else cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Camera")
                    }
                    OutlinedButton(
                        onClick = {
                            galleryLauncher.launch(
                                PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                            )
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Gallery")
                    }
                }
                if (!attachmentLabel.isNullOrBlank()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AttachFile, contentDescription = null, modifier = Modifier.size(16.dp), tint = AnudipTealPrimary)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(attachmentLabel!!, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                ErrorMessageCard(message = errorMessage)
                SuccessMessageCard(message = successMessage)
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(subject, message, attachmentBytes, attachmentMime) },
                enabled = !isSubmitting,
                colors = ButtonDefaults.buttonColors(containerColor = AnudipTealPrimary)
            ) {
                Text(if (isSubmitting) "Sending..." else "Submit Query")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

private fun buildSessionSubtitle(session: StudentSession): String {
    return if (session.studentId.isNotBlank()) {
        "${session.name} • ${session.studentId}"
    } else {
        "${session.name} • ${session.state}"
    }
}

private fun buildSessionDetails(session: StudentSession): String {
    return buildList {
        add("Name: ${session.name}")
        if (session.studentId.isNotBlank()) add("ID: ${session.studentId}")
        if (session.mobileNumber.isNotBlank()) add("Mobile: ${session.mobileNumber}")
        if (session.pinCode.isNotBlank()) add("Pin: ${session.pinCode} (${session.state})")
    }.joinToString("  •  ")
}

private fun openWhatsAppChat(context: Context, phone: String, message: String) {
    val encoded = Uri.encode(message)
    val url = "https://api.whatsapp.com/send?phone=$phone&text=$encoded"
    openExternalUrl(context, url)
}

private fun openExternalUrl(context: Context, url: String) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }.onFailure {
        Toast.makeText(context, "No browser app available to open link.", Toast.LENGTH_SHORT).show()
    }
}

private fun dialNumber(context: Context, phone: String) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
    }
}

private fun sendSupportEmail(context: Context, email: String, session: StudentSession) {
    val subject = Uri.encode("Anudip Student Support - ${session.name} (${session.studentId.ifBlank { session.mobileNumber }})")
    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:$email?subject=$subject"))
    runCatching {
        context.startActivity(intent)
    }.onFailure {
        Toast.makeText(context, "No email app found. Contact $email", Toast.LENGTH_LONG).show()
    }
}
