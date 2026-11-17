package org.anudip.studentcare.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import org.anudip.studentcare.data.model.StudentType
import org.anudip.studentcare.ui.screens.DashboardScreen
import org.anudip.studentcare.ui.screens.ExistingStudentScreen
import org.anudip.studentcare.ui.screens.NewStudentScreen
import org.anudip.studentcare.ui.screens.RoleSelectionScreen
import org.anudip.studentcare.ui.theme.AnudipTealPrimary
import org.anudip.studentcare.ui.viewmodel.StudentCareViewModel

object Routes {
    const val ROLE_SELECTION = "role_selection"
    const val NEW_STUDENT = "new_student"
    const val EXISTING_STUDENT = "existing_student"
    const val DASHBOARD = "dashboard"
}

@Composable
fun AppNavHost(
    viewModel: StudentCareViewModel,
    navController: NavHostController = rememberNavController()
) {
    val isSessionLoaded by viewModel.isSessionLoaded.collectAsStateWithLifecycle()
    val session by viewModel.session.collectAsStateWithLifecycle()
    val isConnected by viewModel.isConnected.collectAsStateWithLifecycle()
    val newStudentForm by viewModel.newStudentForm.collectAsStateWithLifecycle()
    val existingStudentForm by viewModel.existingStudentForm.collectAsStateWithLifecycle()
    val dashboardState by viewModel.dashboard.collectAsStateWithLifecycle()

    if (!isSessionLoaded) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = AnudipTealPrimary)
        }
        return
    }

    val startDestination = if (session != null) Routes.DASHBOARD else Routes.ROLE_SELECTION

    // Automatically return to role selection if session expires mid-use
    LaunchedEffect(session) {
        val currentRoute = navController.currentBackStackEntry?.destination?.route
        if (session == null && currentRoute == Routes.DASHBOARD) {
            navController.navigate(Routes.ROLE_SELECTION) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.ROLE_SELECTION) {
            RoleSelectionScreen(
                isConnected = isConnected,
                onNewStudentClick = { navController.navigate(Routes.NEW_STUDENT) },
                onExistingStudentClick = { navController.navigate(Routes.EXISTING_STUDENT) }
            )
        }

        composable(Routes.NEW_STUDENT) {
            NewStudentScreen(
                formState = newStudentForm,
                isConnected = isConnected,
                onNameChange = viewModel::updateNewName,
                onMobileChange = viewModel::updateNewMobile,
                onPinCodeChange = viewModel::updateNewPinCode,
                onStateChange = viewModel::updateNewState,
                onDetectGps = viewModel::detectLocationFromGps,
                onSubmit = {
                    viewModel.submitNewStudent {
                        navController.navigate(Routes.DASHBOARD) {
                            popUpTo(Routes.ROLE_SELECTION) { inclusive = true }
                        }
                    }
                },
                onChangeRole = { navController.popBackStack() }
            )
        }

        composable(Routes.EXISTING_STUDENT) {
            ExistingStudentScreen(
                formState = existingStudentForm,
                isConnected = isConnected,
                onNameChange = viewModel::updateExistingName,
                onMobileChange = viewModel::updateExistingMobile,
                onStudentIdChange = viewModel::updateExistingStudentId,
                onSubmit = {
                    viewModel.submitExistingStudent {
                        navController.navigate(Routes.DASHBOARD) {
                            popUpTo(Routes.ROLE_SELECTION) { inclusive = true }
                        }
                    }
                },
                onChangeRole = { navController.popBackStack() }
            )
        }

        composable(Routes.DASHBOARD) {
            val activeSession = session
            if (activeSession != null) {
                DashboardScreen(
                    session = activeSession,
                    uiState = dashboardState,
                    isConnected = isConnected,
                    onRefresh = { viewModel.refreshFaqs(silent = false) },
                    onSelectFaq = viewModel::selectFaq,
                    onSelectLanguage = viewModel::selectLanguage,
                    onSubmitTicket = viewModel::submitSupportTicket,
                    onClearTicketStatus = viewModel::clearTicketStatus,
                    onSubmitAnotherEntry = {
                        viewModel.submitAnotherEntry { studentType ->
                            val target = if (studentType == StudentType.NEW_STUDENT) {
                                Routes.NEW_STUDENT
                            } else {
                                Routes.EXISTING_STUDENT
                            }
                            navController.navigate(target) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    onChangeRoleLogout = {
                        viewModel.logout {
                            navController.navigate(Routes.ROLE_SELECTION) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    }
                )
            }
        }
    }
}
