package org.anudip.studentcare.ui.viewmodel

import android.app.Application
import android.util.Base64
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.anudip.studentcare.data.local.FaqCatalog
import org.anudip.studentcare.data.local.SessionDataStore
import org.anudip.studentcare.data.model.FaqItem
import org.anudip.studentcare.data.model.StudentSession
import org.anudip.studentcare.data.model.StudentType
import org.anudip.studentcare.data.remote.NetworkModule
import org.anudip.studentcare.data.repository.RepoResult
import org.anudip.studentcare.data.repository.StudentCareRepository
import org.anudip.studentcare.util.LocationHelper
import org.anudip.studentcare.util.NetworkMonitor

data class NewStudentFormState(
    val name: String = "",
    val mobileNumber: String = "",
    val pinCode: String = "",
    val state: String = "",
    val isLookingUpPin: Boolean = false,
    val isDetectingGps: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null
)

data class ExistingStudentFormState(
    val name: String = "",
    val mobileNumber: String = "",
    val studentId: String = "",
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null
)

data class DashboardUiState(
    val faqs: List<FaqItem> = FaqCatalog.defaultFaqs,
    val languages: List<String> = FaqCatalog.supportedLanguages,
    val selectedFaq: FaqItem = FaqCatalog.defaultFaqs.first(),
    val selectedLanguage: String = "English",
    val translatedQuestion: String = FaqCatalog.defaultFaqs.first().question,
    val translatedAnswer: String = FaqCatalog.defaultFaqs.first().answer,
    val whatsappPhone: String = FaqCatalog.WHATSAPP_PHONE,
    val whatsappDefaultMessage: String = FaqCatalog.WHATSAPP_DEFAULT_TEXT,
    val chatTiming: String = FaqCatalog.CHAT_TIMING,
    val reviewUrl: String = FaqCatalog.REVIEW_URL,
    val isRefreshing: Boolean = false,
    val isTranslating: Boolean = false,
    val translationError: String? = null,
    val isSubmittingTicket: Boolean = false,
    val ticketSuccessMessage: String? = null,
    val ticketErrorMessage: String? = null
)

class StudentCareViewModel(application: Application) : AndroidViewModel(application) {

    private val sessionDataStore = SessionDataStore(application)
    private val networkMonitor = NetworkMonitor(application)
    private val locationHelper = LocationHelper(application)

    @Volatile
    private var currentToken: String? = null

    private val apiService = NetworkModule.createApiService { currentToken }
    private val repository = StudentCareRepository(apiService, sessionDataStore)

    val isConnected: StateFlow<Boolean> = networkMonitor.isConnected

    private val _session = MutableStateFlow<StudentSession?>(null)
    val session: StateFlow<StudentSession?> = _session.asStateFlow()

    private val _isSessionLoaded = MutableStateFlow(false)
    val isSessionLoaded: StateFlow<Boolean> = _isSessionLoaded.asStateFlow()

    private val _newStudentForm = MutableStateFlow(NewStudentFormState())
    val newStudentForm: StateFlow<NewStudentFormState> = _newStudentForm.asStateFlow()

    private val _existingStudentForm = MutableStateFlow(ExistingStudentFormState())
    val existingStudentForm: StateFlow<ExistingStudentFormState> = _existingStudentForm.asStateFlow()

    private val _dashboard = MutableStateFlow(DashboardUiState())
    val dashboard: StateFlow<DashboardUiState> = _dashboard.asStateFlow()

    private var pinLookupJob: Job? = null
    private var translateJob: Job? = null

    init {
        viewModelScope.launch {
            repository.sessionFlow.collect { saved ->
                currentToken = saved?.token
                _session.value = saved
                _isSessionLoaded.value = true
                if (saved != null) {
                    val initialLang = saved.preferredLanguage.ifBlank { "English" }
                    _dashboard.update { it.copy(selectedLanguage = initialLang) }
                    refreshFaqs(silent = true)
                    if (initialLang != "English") {
                        translateSelectedFaq(initialLang)
                    }
                }
            }
        }
    }

    // ---- New Student Form Actions ----

    fun updateNewName(value: String) {
        _newStudentForm.update { it.copy(name = value, errorMessage = null) }
    }

    fun updateNewMobile(value: String) {
        val digits = value.filter { it.isDigit() }.take(10)
        _newStudentForm.update { it.copy(mobileNumber = digits, errorMessage = null) }
    }

    fun updateNewPinCode(value: String) {
        val digits = value.filter { it.isDigit() }.take(6)
        _newStudentForm.update { it.copy(pinCode = digits, errorMessage = null) }

        pinLookupJob?.cancel()
        if (digits.length == 6) {
            pinLookupJob = viewModelScope.launch {
                delay(250)
                lookupPinCode(digits)
            }
        }
    }

    fun updateNewState(value: String) {
        _newStudentForm.update { it.copy(state = value, errorMessage = null) }
    }

    private suspend fun lookupPinCode(pinCode: String) {
        _newStudentForm.update { it.copy(isLookingUpPin = true) }
        val result = repository.lookupPinCode(pinCode)
        when (result) {
            is RepoResult.Success -> {
                _newStudentForm.update {
                    it.copy(
                        state = result.data.state,
                        isLookingUpPin = false
                    )
                }
            }
            is RepoResult.Error -> {
                val fallback = FaqCatalog.inferStateFromPinPrefix(pinCode)
                _newStudentForm.update {
                    it.copy(
                        state = fallback ?: it.state,
                        isLookingUpPin = false
                    )
                }
            }
        }
    }

    fun detectLocationFromGps() {
        viewModelScope.launch {
            _newStudentForm.update { it.copy(isDetectingGps = true, errorMessage = null) }
            val detected = locationHelper.detectStateFromGps()
            if (detected != null) {
                _newStudentForm.update {
                    it.copy(
                        state = detected.state,
                        pinCode = if (it.pinCode.isBlank() && !detected.postalCode.isNullOrBlank()) {
                            detected.postalCode.filter { ch -> ch.isDigit() }.take(6)
                        } else {
                            it.pinCode
                        },
                        isDetectingGps = false
                    )
                }
            } else {
                _newStudentForm.update {
                    it.copy(
                        isDetectingGps = false,
                        errorMessage = "Unable to detect location from GPS. Please enter your 6-digit Pin Code."
                    )
                }
            }
        }
    }

    fun submitNewStudent(onSuccess: () -> Unit) {
        val form = _newStudentForm.value
        val name = form.name.trim()
        val mobile = form.mobileNumber.trim()
        val pin = form.pinCode.trim()
        val state = form.state.trim()

        if (name.isEmpty() || mobile.isEmpty() || pin.isEmpty() || state.isEmpty()) {
            _newStudentForm.update {
                it.copy(errorMessage = "Please fill in Name, Mobile Number, Pin Code and State.")
            }
            return
        }
        if (!mobile.matches(Regex("^[6-9]\\d{9}$"))) {
            _newStudentForm.update {
                it.copy(errorMessage = "Please enter a valid 10-digit Indian mobile number.")
            }
            return
        }
        if (!pin.matches(Regex("^\\d{6}$"))) {
            _newStudentForm.update {
                it.copy(errorMessage = "Please enter a valid 6-digit Pin Code (e.g. 600001).")
            }
            return
        }
        if (!isConnected.value) {
            _newStudentForm.update {
                it.copy(errorMessage = "No internet connection. Please connect to submit.")
            }
            return
        }

        viewModelScope.launch {
            _newStudentForm.update { it.copy(isSubmitting = true, errorMessage = null) }
            when (val res = repository.submitNewStudent(name, mobile, pin, state)) {
                is RepoResult.Success -> {
                    currentToken = res.data.token
                    _session.value = res.data
                    _newStudentForm.update { NewStudentFormState() }
                    refreshFaqs(silent = true)
                    onSuccess()
                }
                is RepoResult.Error -> {
                    _newStudentForm.update {
                        it.copy(isSubmitting = false, errorMessage = res.message)
                    }
                }
            }
        }
    }

    // ---- Existing Student Form Actions (Exact Streamlit Validation Parity) ----

    fun updateExistingName(value: String) {
        _existingStudentForm.update { it.copy(name = value, errorMessage = null) }
    }

    fun updateExistingMobile(value: String) {
        val digits = value.filter { it.isDigit() }.take(10)
        _existingStudentForm.update { it.copy(mobileNumber = digits, errorMessage = null) }
    }

    fun updateExistingStudentId(value: String) {
        val cleaned = value.uppercase().filter { it.isLetterOrDigit() }.take(20)
        _existingStudentForm.update { it.copy(studentId = cleaned, errorMessage = null) }
    }

    fun submitExistingStudent(onSuccess: () -> Unit) {
        val form = _existingStudentForm.value
        val name = form.name.trim()
        val mobile = form.mobileNumber.trim()
        val studentId = form.studentId.trim().uppercase()

        if (name.isEmpty()) {
            _existingStudentForm.update { it.copy(errorMessage = "Please enter your Name.") }
            return
        }
        if (studentId.isEmpty()) {
            _existingStudentForm.update { it.copy(errorMessage = "Please enter your Student ID.") }
            return
        }
        if (!studentId.startsWith("AF0") || studentId.length < 5) {
            _existingStudentForm.update {
                it.copy(errorMessage = "Student ID is mandatory and must start with 'AF0' (e.g., AF05319302).")
            }
            return
        }
        if (mobile.isNotEmpty() && !mobile.matches(Regex("^[6-9]\\d{9}$"))) {
            _existingStudentForm.update {
                it.copy(errorMessage = "CMIS Register Mobile Number must be a valid 10-digit mobile number.")
            }
            return
        }
        if (!isConnected.value) {
            _existingStudentForm.update {
                it.copy(errorMessage = "No internet connection. Please connect to verify your Student ID.")
            }
            return
        }

        viewModelScope.launch {
            _existingStudentForm.update { it.copy(isSubmitting = true, errorMessage = null) }
            when (val res = repository.verifyExistingStudent(name, mobile, studentId)) {
                is RepoResult.Success -> {
                    currentToken = res.data.token
                    _session.value = res.data
                    _existingStudentForm.update { ExistingStudentFormState() }
                    refreshFaqs(silent = true)
                    onSuccess()
                }
                is RepoResult.Error -> {
                    _existingStudentForm.update {
                        it.copy(isSubmitting = false, errorMessage = res.message)
                    }
                }
            }
        }
    }

    // ---- Dashboard Actions ----

    fun refreshFaqs(silent: Boolean = false) {
        viewModelScope.launch {
            if (!silent) {
                _dashboard.update { it.copy(isRefreshing = true) }
            }
            when (val res = repository.fetchFaqs()) {
                is RepoResult.Success -> {
                    val data = res.data
                    val currentSelectedIndex = _dashboard.value.selectedFaq.index
                    val updatedFaq = data.faqs.find { it.index == currentSelectedIndex }
                        ?: data.faqs.firstOrNull()
                        ?: FaqCatalog.defaultFaqs.first()
                    _dashboard.update {
                        it.copy(
                            faqs = data.faqs.ifEmpty { FaqCatalog.defaultFaqs },
                            languages = data.languages.ifEmpty { FaqCatalog.supportedLanguages },
                            selectedFaq = updatedFaq,
                            whatsappPhone = data.whatsappPhone,
                            whatsappDefaultMessage = data.whatsappDefaultMessage,
                            chatTiming = data.chatTiming,
                            reviewUrl = data.reviewUrl,
                            isRefreshing = false
                        )
                    }
                }
                is RepoResult.Error -> {
                    if (res.isUnauthorized) {
                        currentToken = null
                        _session.value = null
                    }
                    _dashboard.update { it.copy(isRefreshing = false) }
                }
            }
        }
    }

    fun selectFaq(faq: FaqItem) {
        val currentLang = _dashboard.value.selectedLanguage
        _dashboard.update {
            it.copy(
                selectedFaq = faq,
                translatedQuestion = if (currentLang == "English") faq.question else it.translatedQuestion,
                translatedAnswer = if (currentLang == "English") faq.answer else it.translatedAnswer,
                translationError = null
            )
        }
        if (currentLang != "English") {
            translateSelectedFaq(currentLang)
        }
    }

    fun selectLanguage(language: String) {
        _dashboard.update {
            it.copy(
                selectedLanguage = language,
                translationError = null
            )
        }
        viewModelScope.launch {
            repository.updatePreferredLanguage(language)
        }
        translateSelectedFaq(language)
    }

    private fun translateSelectedFaq(language: String) {
        val faq = _dashboard.value.selectedFaq
        if (language == "English") {
            translateJob?.cancel()
            _dashboard.update {
                it.copy(
                    translatedQuestion = faq.question,
                    translatedAnswer = faq.answer,
                    isTranslating = false,
                    translationError = null
                )
            }
            return
        }

        if (!isConnected.value) {
            _dashboard.update {
                it.copy(
                    isTranslating = false,
                    translationError = "Internet connection required to translate into $language."
                )
            }
            return
        }

        translateJob?.cancel()
        translateJob = viewModelScope.launch {
            _dashboard.update { it.copy(isTranslating = true, translationError = null) }
            when (val res = repository.translateQa(faq.question, faq.answer, language)) {
                is RepoResult.Success -> {
                    _dashboard.update {
                        it.copy(
                            translatedQuestion = res.data.translatedQuestion,
                            translatedAnswer = res.data.translatedAnswer,
                            isTranslating = false,
                            translationError = null
                        )
                    }
                }
                is RepoResult.Error -> {
                    if (res.isUnauthorized) {
                        currentToken = null
                        _session.value = null
                    }
                    _dashboard.update {
                        it.copy(
                            isTranslating = false,
                            translationError = res.message
                        )
                    }
                }
            }
        }
    }

    fun submitSupportTicket(
        subject: String,
        message: String,
        attachmentBytes: ByteArray?,
        attachmentMimeType: String?
    ) {
        if (subject.isBlank() || message.isBlank()) {
            _dashboard.update {
                it.copy(ticketErrorMessage = "Please enter both a subject and description of your concern.")
            }
            return
        }
        if (!isConnected.value) {
            _dashboard.update {
                it.copy(ticketErrorMessage = "No internet connection. Unable to submit your query.")
            }
            return
        }

        viewModelScope.launch {
            _dashboard.update {
                it.copy(
                    isSubmittingTicket = true,
                    ticketErrorMessage = null,
                    ticketSuccessMessage = null
                )
            }
            val encoded = withContext(Dispatchers.Default) {
                attachmentBytes?.let { Base64.encodeToString(it, Base64.NO_WRAP) }
            }
            when (val res = repository.submitSupportTicket(subject, message, encoded, attachmentMimeType)) {
                is RepoResult.Success -> {
                    _dashboard.update {
                        it.copy(
                            isSubmittingTicket = false,
                            ticketSuccessMessage = "${res.data.message} (Ref: ${res.data.ticketId})"
                        )
                    }
                }
                is RepoResult.Error -> {
                    if (res.isUnauthorized) {
                        currentToken = null
                        _session.value = null
                    }
                    _dashboard.update {
                        it.copy(
                            isSubmittingTicket = false,
                            ticketErrorMessage = res.message
                        )
                    }
                }
            }
        }
    }

    fun clearTicketStatus() {
        _dashboard.update {
            it.copy(ticketSuccessMessage = null, ticketErrorMessage = null)
        }
    }

    fun submitAnotherEntry(onNavigateToEntryForm: (StudentType) -> Unit) {
        val type = _session.value?.studentType ?: StudentType.EXISTING_STUDENT
        viewModelScope.launch {
            repository.logout()
            currentToken = null
            _session.value = null
            onNavigateToEntryForm(type)
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            repository.logout()
            currentToken = null
            _session.value = null
            _newStudentForm.value = NewStudentFormState()
            _existingStudentForm.value = ExistingStudentFormState()
            onComplete()
        }
    }

    override fun onCleared() {
        super.onCleared()
        networkMonitor.unregister()
    }
}
