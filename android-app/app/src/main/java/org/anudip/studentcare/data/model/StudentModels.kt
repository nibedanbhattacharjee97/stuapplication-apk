package org.anudip.studentcare.data.model

import com.google.gson.annotations.SerializedName

enum class StudentType(val label: String, val badge: String) {
    NEW_STUDENT("New Student", "🧑‍🎓 New Student"),
    EXISTING_STUDENT("Existing Student", "🎓 Existing Student")
}

data class StudentSession(
    val token: String,
    val expiresAtEpochMs: Long,
    val studentType: StudentType,
    val name: String,
    val studentId: String = "",
    val mobileNumber: String = "",
    val pinCode: String = "",
    val state: String = "",
    val preferredLanguage: String = "English"
) {
    fun isExpired(nowMs: Long = System.currentTimeMillis()): Boolean {
        return token.isBlank() || nowMs >= expiresAtEpochMs
    }
}

data class FaqItem(
    val index: Int,
    val question: String,
    val answer: String
)

data class NewStudentRequest(
    val name: String,
    @SerializedName("mobileNumber") val mobileNumber: String,
    @SerializedName("pinCode") val pinCode: String,
    val state: String
)

data class ExistingStudentVerifyRequest(
    val name: String,
    @SerializedName("mobileNumber") val mobileNumber: String?,
    @SerializedName("studentId") val studentId: String
)

data class AuthResponse(
    val success: Boolean,
    val token: String,
    val expiresAtEpochMs: Long,
    val studentType: String,
    val name: String,
    val studentId: String? = null,
    val mobileNumber: String? = null,
    val pinCode: String? = null,
    val state: String? = null,
    val message: String? = null
)

data class FaqsResponse(
    val faqs: List<FaqItem>,
    val languages: List<String>,
    val whatsappPhone: String,
    val whatsappDefaultMessage: String,
    val chatTiming: String,
    val reviewUrl: String
)

data class TranslateRequest(
    val question: String,
    val answer: String,
    val targetLanguage: String
)

data class TranslateResponse(
    val targetLanguage: String,
    val translatedQuestion: String,
    val translatedAnswer: String
)

data class PinLookupResponse(
    val pinCode: String,
    val state: String,
    val district: String? = null
)

data class SupportTicketRequest(
    val subject: String,
    val message: String,
    val attachmentBase64: String? = null,
    val attachmentMimeType: String? = null
)

data class SupportTicketResponse(
    val success: Boolean,
    val ticketId: String,
    val message: String
)

data class ApiErrorResponse(
    val error: String? = null,
    val message: String? = null
)
