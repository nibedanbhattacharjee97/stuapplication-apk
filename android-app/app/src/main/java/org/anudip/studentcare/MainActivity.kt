package org.anudip.studentcare

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import org.anudip.studentcare.ui.navigation.AppNavHost
import org.anudip.studentcare.ui.theme.AnudipStudentCareTheme
import org.anudip.studentcare.ui.viewmodel.StudentCareViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: StudentCareViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        splashScreen.setKeepOnScreenCondition {
            !viewModel.isSessionLoaded.value
        }

        enableEdgeToEdge()
        setContent {
            AnudipStudentCareTheme {
                AppNavHost(viewModel = viewModel)
            }
        }
    }
}
