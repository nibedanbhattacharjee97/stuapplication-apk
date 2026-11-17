package org.anudip.studentcare.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.anudip.studentcare.data.model.StudentSession
import org.anudip.studentcare.data.model.StudentType

private val Context.studentSessionDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "anudip_student_session"
)

class SessionDataStore(private val context: Context) {

    private object Keys {
        val TOKEN = stringPreferencesKey("auth_token")
        val EXPIRES_AT = longPreferencesKey("expires_at_epoch_ms")
        val STUDENT_TYPE = stringPreferencesKey("student_type")
        val NAME = stringPreferencesKey("student_name")
        val STUDENT_ID = stringPreferencesKey("student_id")
        val MOBILE = stringPreferencesKey("mobile_number")
        val PIN_CODE = stringPreferencesKey("pin_code")
        val STATE = stringPreferencesKey("state")
        val LANGUAGE = stringPreferencesKey("preferred_language")
    }

    val sessionFlow: Flow<StudentSession?> = context.studentSessionDataStore.data.map { prefs ->
        val token = prefs[Keys.TOKEN].orEmpty()
        val expiresAt = prefs[Keys.EXPIRES_AT] ?: 0L
        val typeRaw = prefs[Keys.STUDENT_TYPE]
        val name = prefs[Keys.NAME].orEmpty()

        if (token.isBlank() || typeRaw.isNullOrBlank() || name.isBlank()) {
            null
        } else {
            val studentType = runCatching { StudentType.valueOf(typeRaw) }
                .getOrDefault(StudentType.EXISTING_STUDENT)
            val session = StudentSession(
                token = token,
                expiresAtEpochMs = expiresAt,
                studentType = studentType,
                name = name,
                studentId = prefs[Keys.STUDENT_ID].orEmpty(),
                mobileNumber = prefs[Keys.MOBILE].orEmpty(),
                pinCode = prefs[Keys.PIN_CODE].orEmpty(),
                state = prefs[Keys.STATE].orEmpty(),
                preferredLanguage = prefs[Keys.LANGUAGE] ?: "English"
            )
            if (session.isExpired()) null else session
        }
    }

    suspend fun saveSession(session: StudentSession) {
        context.studentSessionDataStore.edit { prefs ->
            prefs[Keys.TOKEN] = session.token
            prefs[Keys.EXPIRES_AT] = session.expiresAtEpochMs
            prefs[Keys.STUDENT_TYPE] = session.studentType.name
            prefs[Keys.NAME] = session.name
            prefs[Keys.STUDENT_ID] = session.studentId
            prefs[Keys.MOBILE] = session.mobileNumber
            prefs[Keys.PIN_CODE] = session.pinCode
            prefs[Keys.STATE] = session.state
            prefs[Keys.LANGUAGE] = session.preferredLanguage
        }
    }

    suspend fun updatePreferredLanguage(language: String) {
        context.studentSessionDataStore.edit { prefs ->
            prefs[Keys.LANGUAGE] = language
        }
    }

    suspend fun clearSession() {
        context.studentSessionDataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
