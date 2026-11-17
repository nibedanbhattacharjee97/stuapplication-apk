package org.anudip.studentcare

import org.anudip.studentcare.data.local.FaqCatalog
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ValidationTest {

    @Test
    fun catalogHasAll41OfficialQuestions() {
        assertEquals(41, FaqCatalog.defaultFaqs.size)
        assertEquals(11, FaqCatalog.supportedLanguages.size)
    }

    @Test
    fun pinPrefixMapsExpectedStates() {
        assertEquals("Tamil Nadu", FaqCatalog.inferStateFromPinPrefix("600001"))
        assertEquals("West Bengal", FaqCatalog.inferStateFromPinPrefix("700001"))
        assertEquals("Delhi", FaqCatalog.inferStateFromPinPrefix("110001"))
        assertNull(FaqCatalog.inferStateFromPinPrefix("1"))
    }
}
