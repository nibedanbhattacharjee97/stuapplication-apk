package org.anudip.studentcare.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import org.anudip.studentcare.ui.components.AnudipCaresBannerCard
import org.anudip.studentcare.ui.components.ChangeRoleButtonRow
import org.anudip.studentcare.ui.components.ErrorMessageCard
import org.anudip.studentcare.ui.components.FieldLabelWithHelp
import org.anudip.studentcare.ui.components.OfflineStatusBanner
import org.anudip.studentcare.ui.components.PrimarySubmitButton
import org.anudip.studentcare.ui.components.TooltipInfoDialog
import org.anudip.studentcare.ui.theme.AnudipBackground
import org.anudip.studentcare.ui.theme.AnudipOutline
import org.anudip.studentcare.ui.theme.AnudipTealPrimary
import org.anudip.studentcare.ui.viewmodel.ExistingStudentFormState

@Composable
fun ExistingStudentScreen(
    formState: ExistingStudentFormState,
    isConnected: Boolean,
    onNameChange: (String) -> Unit,
    onMobileChange: (String) -> Unit,
    onStudentIdChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onChangeRole: () -> Unit
) {
    BackHandler(onBack = onChangeRole)

    val focusManager = LocalFocusManager.current
    var helpDialog by remember { mutableStateOf<Pair<String, String>?>(null) }

    Scaffold(
        containerColor = AnudipBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            OfflineStatusBanner(isConnected = isConnected)

            ChangeRoleButtonRow(onChangeClick = onChangeRole)

            Spacer(modifier = Modifier.height(10.dp))

            AnudipCaresBannerCard()

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Anudip Student Bot",
                style = MaterialTheme.typography.headlineMedium,
                color = AnudipTealPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "You selected: 🎓 Existing Student",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium
            )

            Spacer(modifier = Modifier.height(16.dp))

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
                        .padding(18.dp)
                ) {
                    FieldLabelWithHelp(label = "Name")
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = formState.name,
                        onValueChange = onNameChange,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Enter your full name") },
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.Words,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    FieldLabelWithHelp(
                        label = "CMIS Register Mobile Number (Optional)",
                        helpText = "Optional: 10-digit mobile number",
                        onHelpClick = { t, m -> helpDialog = t to m }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = formState.mobileNumber,
                        onValueChange = onMobileChange,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Optional: 10-digit mobile number") },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Phone,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    FieldLabelWithHelp(
                        label = "Student ID (Mandatory)",
                        helpText = "Must start with 'AF0' (e.g., AF05319302)",
                        onHelpClick = { t, m -> helpDialog = t to m }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = formState.studentId,
                        onValueChange = onStudentIdChange,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("e.g., AF05319302") },
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.Characters,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                onSubmit()
                            }
                        )
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    PrimarySubmitButton(
                        text = "✅ Submit",
                        isLoading = formState.isSubmitting,
                        onClick = {
                            focusManager.clearFocus()
                            onSubmit()
                        }
                    )

                    if (!formState.errorMessage.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        ErrorMessageCard(message = formState.errorMessage)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    helpDialog?.let { (title, message) ->
        TooltipInfoDialog(
            title = title,
            message = message,
            onDismiss = { helpDialog = null }
        )
    }
}
