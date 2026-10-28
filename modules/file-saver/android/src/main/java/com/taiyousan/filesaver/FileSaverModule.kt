package com.taiyousan.filesaver

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.Serializable

/**
 * "Save as" dialog (ACTION_CREATE_DOCUMENT): the user picks the folder, Downloads included, and
 * the file name. Unlike a folder picker, the app only gets access to the created file, so
 * Android doesn't restrict where it goes.
 */
class FileSaverModule : Module() {
  private lateinit var createDocument: AppContextActivityResultLauncher<CreateDocumentInput, Uri?>

  override fun definition() = ModuleDefinition {
    Name("FileSaver")

    RegisterActivityContracts {
      createDocument = registerForActivityResult(CreateDocumentContract())
    }

    /** Resolves to false when the user cancelled the dialog. */
    AsyncFunction("saveAsync") Coroutine { name: String, mimeType: String, content: String ->
      val uri = createDocument.launch(CreateDocumentInput(name, mimeType)) ?: return@Coroutine false
      val resolver = appContext.reactContext?.contentResolver
        ?: throw IllegalStateException("React context is not available")
      withContext(Dispatchers.IO) {
        // "wt" truncates: the user may have picked an existing, longer file to replace.
        val stream = resolver.openOutputStream(uri, "wt")
          ?: throw IllegalStateException("Cannot write to $uri")
        stream.use { it.write(content.toByteArray(Charsets.UTF_8)) }
      }
      true
    }
  }
}

internal data class CreateDocumentInput(val name: String, val mimeType: String) : Serializable

internal class CreateDocumentContract : AppContextActivityResultContract<CreateDocumentInput, Uri?> {
  override fun createIntent(context: Context, input: CreateDocumentInput): Intent =
    Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = input.mimeType
      putExtra(Intent.EXTRA_TITLE, input.name)
    }

  override fun parseResult(input: CreateDocumentInput, resultCode: Int, intent: Intent?): Uri? =
    if (resultCode == Activity.RESULT_OK) intent?.data else null
}
