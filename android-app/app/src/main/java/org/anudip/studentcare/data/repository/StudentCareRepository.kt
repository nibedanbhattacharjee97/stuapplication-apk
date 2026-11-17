package org.anudip.studentcare.data.repository

import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import org.anudip.studentcare.data.local.FaqCatalog
import org.anudip.studentcare.data.local.SessionDataStore
import org.anudip.studentcare.data.model.ApiErrorResponse
import org.anudip.studentcare.data.model.ExistingStudentVerifyRequest
import org.anudip.studentcare.data.model.FaqsResponse
import org.anudip.studentcare.data.model.NewStudentRequest
import org.anudip.studentcare.data.model.PinLookupResponse
import org.anudip.studentcare.data.model.StudentSession
import org.anudip.studentcare.data.model.StudentType
import org.anudip.studentcare.data.model.SupportTicketRequest
import org.anudip.studentcare.data.model.SupportTicketResponse
import org.anudip.studentcare.data.model.TranslateRequest
import org.anudip.studentcare.data.model.TranslateResponse
import org.anudip.studentcare.data.remote.AnudipApiService
import retrofit2.Response
import java.io.IOException

sealed class RepoResult<out T> {
    data class Success<T>(val data: T) : RepoResult<T>()
    data class Error(val message: String, val isUnauthorized: Boolean = false) : RepoResult<Nothing>()
}

class StudentCareRepository(
    private val apiService: AnudipApiService,
    private val sessionDataStore: SessionDataStore
) {
    private val gson = Gson()

    val sessionFlow: Flow<StudentSession?> = sessionDataStore.sessionFlow

    suspend fun submitNewStudent(
        name: String,
        mobileNumber: String,
        pinCode: String,
        state: String
    ): RepoResult<StudentSession> {
        return safeCall(
            call = {
                apiService.submitNewStudent(
                    NewStudentRequest(
                        name = name.trim(),
                        mobileNumber = mobileNumber.trim(),
                        pinCode = pinCode.trim(),
                        state = state.trim()
                    )
                )
            },
            onSuccess = { body ->
                val session = StudentSession(
                    token = body.token,
                    expiresAtEpochMs = body.expiresAtEpochMs,
                    studentType = StudentType.NEW_STUDENT,
                    name = body.name,
                    mobileNumber = body.mobileNumber ?: mobileNumber.trim(),
                    pinCode = body.pinCode ?: pinCode.trim(),
                    state = body.state ?: state.trim(),
                    preferredLanguage = "English"
                )
                sessionDataStore.saveSession(session)
                session
            }
        )
    }

    suspend fun verifyExistingStudent(
        name: String,
        mobileNumber: String?,
        studentId: String
    ): RepoResult<StudentSession> {
        return safeCall(
            call = {
                apiService.verifyExistingStudent(
                    ExistingStudentVerifyRequest(
                        name = name.trim(),
                        mobileNumber = mobileNumber?.trim()?.takeIf { it.isNotEmpty() },
                        studentId = studentId.trim().uppercase()
                    )
                )
            },
            onSuccess = { body ->
                val session = StudentSession(
                    token = body.token,
                    expiresAtEpochMs = body.expiresAtEpochMs,
                    studentType = StudentType.EXISTING_STUDENT,
                    name = body.name,
                    studentId = body.studentId ?: studentId.trim().uppercase(),
                    mobileNumber = body.mobileNumber ?: mobileNumber?.trim().orEmpty(),
                    preferredLanguage = "English"
                )
                sessionDataStore.saveSession(session)
                session
            }
        )
    }

    suspend fun fetchFaqs(): RepoResult<FaqsResponse> {
        return safeCall(
            call = { apiService.getFaqs() },
            onSuccess = { it }
        )
    }

    suspend fun lookupPinCode(pinCode: String): RepoResult<PinLookupResponse> {
        return safeCall(
            call = { apiService.lookupPinCode(pinCode) },
            onSuccess = { it }
        )
    }

    suspend fun translateQa(
        question: String,
        answer: String,
        targetLanguage: String
    ): RepoResult<TranslateResponse> {
        if (targetLanguage == "English") {
            return RepoResult.Success(
                TranslateResponse(
                    targetLanguage = "English",
                    translatedQuestion = question,
                    translatedAnswer = answer
                )
            )
        }
        return safeCall(
            call = {
                apiService.translateQa(
                    TranslateRequest(
                        question = question,
                        answer = answer,
                        targetLanguage = targetLanguage
                    )
                )
            },
            onSuccess = { it }
        )
    }

    suspend fun submitSupportTicket(
        subject: String,
        message: String,
        attachmentBase64: String?,
        attachmentMimeType: String?
    ): RepoResult<SupportTicketResponse> {
        return safeCall(
            call = {
                apiService.submitSupportTicket(
                    SupportTicketRequest(
                        subject = subject.trim(),
                        message = message.trim(),
                        attachmentBase64 = attachmentBase64,
                        attachmentMimeType = attachmentMimeType
                    )
                )
            },
            onSuccess = { it }
        )
    }

    suspend fun updatePreferredLanguage(language: String) {
        sessionDataStore.updatePreferredLanguage(language)
    }

    suspend fun logout() {
        sessionDataStore.clearSession()
    }

    private suspend fun <T, R> safeCall(
        call: suspend () -> Response<T>,
        onSuccess: suspend (T) -> R
    ): RepoResult<R> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    RepoResult.Success(onSuccess(body))
                } else {
                    RepoResult.Error("Empty response received from server.")
                }
            } else {
                val isUnauth = response.code() == 401 || response.code() == 403
                if (isUnauth) {
                    sessionDataStore.clearSession()
                }
                val errText = response.errorBody()?.string()
                val parsedMsg = runCatching {
                    gson.fromJson(errText, ApiErrorResponse::class.java)
                }.getOrNull()?.let { it.message ?: it.error }
                RepoResult.Error(
                    message = parsedMsg ?: "Request failed (${response.code()}). Please try again.",
                    isUnauthorized = isUnauth
                )
            }
        } catch (_: IOException) {
            RepoResult.Error("Unable to reach Anudip Student Care server. Check your internet connection.")
        } catch (e: Exception) {
            RepoResult.Error(e.localizedMessage ?: "An unexpected error occurred.")
        }
    }

    fun defaultFaqFallback(): FaqsResponse {
        return FaqsResponse(
            faqs = FaqCatalog.defaultFaqs,
            languages = FaqCatalog.supportedLanguages,
            whatsappPhone = FaqCatalog.WHATSAPP_PHONE,
            whatsappDefaultMessage = FaqCatalog.WHATSAPP_DEFAULT_TEXT,
            chatTiming = FaqCatalog.CHAT_TIMING,
            reviewUrl = FaqCatalog.REVIEW_URL
        )
    }
}
