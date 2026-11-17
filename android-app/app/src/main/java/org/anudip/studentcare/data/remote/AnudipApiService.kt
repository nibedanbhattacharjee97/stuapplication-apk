package org.anudip.studentcare.data.remote

import org.anudip.studentcare.data.model.AuthResponse
import org.anudip.studentcare.data.model.ExistingStudentVerifyRequest
import org.anudip.studentcare.data.model.FaqsResponse
import org.anudip.studentcare.data.model.NewStudentRequest
import org.anudip.studentcare.data.model.PinLookupResponse
import org.anudip.studentcare.data.model.SupportTicketRequest
import org.anudip.studentcare.data.model.SupportTicketResponse
import org.anudip.studentcare.data.model.TranslateRequest
import org.anudip.studentcare.data.model.TranslateResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface AnudipApiService {

    @POST("api/students/new")
    suspend fun submitNewStudent(
        @Body request: NewStudentRequest
    ): Response<AuthResponse>

    @POST("api/students/existing/verify")
    suspend fun verifyExistingStudent(
        @Body request: ExistingStudentVerifyRequest
    ): Response<AuthResponse>

    @GET("api/faqs")
    suspend fun getFaqs(): Response<FaqsResponse>

    @GET("api/pincode/{pin}")
    suspend fun lookupPinCode(
        @Path("pin") pinCode: String
    ): Response<PinLookupResponse>

    @POST("api/translate")
    suspend fun translateQa(
        @Body request: TranslateRequest
    ): Response<TranslateResponse>

    @POST("api/support/ticket")
    suspend fun submitSupportTicket(
        @Body request: SupportTicketRequest
    ): Response<SupportTicketResponse>
}
