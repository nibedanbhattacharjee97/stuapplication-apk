package org.anudip.studentcare.util

import android.annotation.SuppressLint
import android.content.Context
import android.location.Geocoder
import android.os.Build
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.util.Locale
import kotlin.coroutines.resume

data class DetectedLocation(
    val state: String,
    val postalCode: String?
)

class LocationHelper(private val context: Context) {

    @SuppressLint("MissingPermission")
    suspend fun detectStateFromGps(): DetectedLocation? = withContext(Dispatchers.IO) {
        val client = LocationServices.getFusedLocationProviderClient(context)
        val location = suspendCancellableCoroutine { cont ->
            val cts = CancellationTokenSource()
            cont.invokeOnCancellation { cts.cancel() }
            client.getCurrentLocation(Priority.PRIORITY_BALANCED_POWER_ACCURACY, cts.token)
                .addOnSuccessListener { loc -> cont.resume(loc) }
                .addOnFailureListener { cont.resume(null) }
        } ?: return@withContext null

        val geocoder = Geocoder(context, Locale.getDefault())
        runCatching {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                suspendCancellableCoroutine { cont ->
                    geocoder.getFromLocation(location.latitude, location.longitude, 1) { list ->
                        val addr = list.firstOrNull()
                        val state = addr?.adminArea?.trim().orEmpty()
                        if (state.isNotEmpty()) {
                            cont.resume(DetectedLocation(state = state, postalCode = addr?.postalCode))
                        } else {
                            cont.resume(null)
                        }
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                val addr = geocoder.getFromLocation(location.latitude, location.longitude, 1)?.firstOrNull()
                val state = addr?.adminArea?.trim().orEmpty()
                if (state.isNotEmpty()) {
                    DetectedLocation(state = state, postalCode = addr?.postalCode)
                } else {
                    null
                }
            }
        }.getOrNull()
    }
}
