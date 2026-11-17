package org.anudip.studentcare.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
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
import org.anudip.studentcare.ui.viewmodel.NewStudentFormState

@Composable
fun NewStudentScreen(
    formState: NewStudentFormState,
    isConnected: Boolean,
    onNameChange: (String) -> Unit,
    onMobileChange: (String) -> Unit,
    onPinCodeChange: (String) -> Unit,
    onStateChange: (String) -> Unit,
    onDetectGps: () -> Unit,
    onSubmit: () -> Unit,
    onChangeRole: () -> Unit
) {
    BackHandler(onBack = onChangeRole)

    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    var helpDialog by remember { mutableStateOf<Pair<String, String>?>(null) }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val granted = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
            grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            onDetectGps()
        }
    }

    fun requestGpsDetection() {
        val hasFine = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasFine || hasCoarse) {
            onDetectGps()
        } else {
            locationPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.ACCESS_FINE_LOCATION
                )
            )
        }
    }

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
                text = "You selected: 🧑‍🎓 New Student",
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

                    FieldLabelWithHelp(label = "Mobile Number")
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = formState.mobileNumber,
                        onValueChange = onMobileChange,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("10-digit mobile number") },
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
                        label = "Pin Code",
                        helpText = "Type your 6-digit postal PIN code. State will auto-fill automatically.",
                        onHelpClick = { t, m -> helpDialog = t to m }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = formState.pinCode,
                        onValueChange = onPinCodeChange,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Enter 6-digit Pin Code (e.g. 600001)") },
                        trailingIcon = {
                            if (formState.isLookingUpPin) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(18.dp),
                                    strokeWidth = 2.dp
                                )
                            }
                        },
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Next
                        ),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    FieldLabelWithHelp(
                        label = "State",
                        helpText = "State is automatically updated from your location or when you type your Pin Code.",
                        onHelpClick = { t, m -> helpDialog = t to m }
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = formState.state,
                            onValueChange = onStateChange,
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            placeholder = { Text("Auto-detected from GPS / Pin Code") },
                            keyboardOptions = KeyboardOptions(
                                capitalization = KeyboardCapitalization.Words,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(
                                onDone = {
                                    focusManager.clearFocus()
                                    onSubmit()
                                }
                            )
                        )
                        OutlinedButton(
                            onClick = { requestGpsDetection() },
                            enabled = !formState.isDetectingGps,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, AnudipOutline),
                            modifier = Modifier.height(54.dp)
                        ) {
                            if (formState.isDetectingGps) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(16.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(
                                    imageVector = Icons.Default.MyLocation,
                                    contentDescription = "Detect State via GPS",
                                    tint = AnudipTealPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("GPS")
                        }
                    }

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
