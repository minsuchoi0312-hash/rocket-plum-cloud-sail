package com.officeprint.office_print

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.provider.Settings
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.nio.charset.Charset
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : FlutterActivity() {
    private val channelName = "office_print/usb"
    private val shareChannelName = "office_print/share"
    private val wifiChannelName = "office_print/wifi"
    private val permissionAction = "com.officeprint.office_print.USB_PERMISSION"
    private val mainHandler = Handler(Looper.getMainLooper())
    private val io = Executors.newSingleThreadExecutor()
    private var channel: MethodChannel? = null
    private var shareChannel: MethodChannel? = null
    private var pendingShare: Map<String, String>? = null
    private var connection: UsbDeviceConnection? = null
    private var claimed: UsbInterface? = null
    private var outEndpoint: UsbEndpoint? = null
    private var pendingResult: MethodChannel.Result? = null
    private var multicastLock: WifiManager.MulticastLock? = null
    @Volatile private var pipeBroken = false
    @Volatile private var writeGeneration = 0
    @Volatile private var cancelledGeneration = -1
    private var usbDeviceId = -1
    private var detachRegistered = false
    private val usbLock = Any()
    private val permissionTimeout = Runnable {
        val result = pendingResult ?: return@Runnable
        pendingResult = null
        replyError(result, "denied", "USB 권한 요청이 시간 안에 끝나지 않았어요.")
    }

    private val permissionReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != permissionAction) return
            mainHandler.removeCallbacks(permissionTimeout)
            val device = IntentCompat.getParcelableExtra(intent, UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
            val result = pendingResult
            pendingResult = null
            if (result == null) return
            if (!granted || device == null) {
                replyError(result, "denied", "USB 권한을 허용하지 않았어요.")
                return
            }
            io.execute {
                try {
                    replySuccess(result, openDevice(device))
                } catch (error: Exception) {
                    replyError(result, "usb", error.message ?: "USB 복사기를 열지 못했어요.")
                }
            }
        }
    }

    private val detachReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != UsbManager.ACTION_USB_DEVICE_DETACHED) return
            val device = IntentCompat.getParcelableExtra(intent, UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
            val current = synchronized(usbLock) { usbDeviceId }
            if (current < 0) return
            if (device != null && device.deviceId != current) return
            pipeBroken = true
            cancelledGeneration = writeGeneration
            closeQuietly()
            mainHandler.post {
                channel?.invokeMethod("detached", null)
            }
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        val filter = IntentFilter(permissionAction)
        ContextCompat.registerReceiver(this, permissionReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        if (!detachRegistered) {
            ContextCompat.registerReceiver(
                this,
                detachReceiver,
                IntentFilter(UsbManager.ACTION_USB_DEVICE_DETACHED),
                ContextCompat.RECEIVER_NOT_EXPORTED,
            )
            detachRegistered = true
        }
        channel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
        shareChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, shareChannelName)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, wifiChannelName).setMethodCallHandler { call, result ->
            when (call.method) {
                "acquire" -> {
                    acquireMulticast()
                    result.success(null)
                }
                "release" -> {
                    releaseMulticast()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        }
        shareChannel?.setMethodCallHandler { call, result ->
            if (call.method == "take") {
                result.success(pendingShare)
                pendingShare = null
            } else {
                result.notImplemented()
            }
        }
        channel?.setMethodCallHandler { call, result ->
            when (call.method) {
                "list" -> result.success(listDevices())
                "open" -> requestOpen(call.argument<Int>("deviceId") ?: -1, result)
                "write" -> writeBytes(call.argument<ByteArray>("bytes"), result)
                "stop" -> {
                    cancelledGeneration = writeGeneration
                    result.success(null)
                }
                "cancel" -> {
                    pipeBroken = true
                    cancelledGeneration = writeGeneration
                    closeQuietly()
                    result.success(null)
                }
                "close" -> {
                    closeQuietly()
                    result.success(null)
                }
                "guardStart" -> {
                    tryStartPrintGuard()
                    result.success(null)
                }
                "guardStop" -> {
                    tryStopPrintGuard()
                    result.success(null)
                }
                "openSettings" -> {
                    try {
                        startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                        result.success(true)
                    } catch (_: Exception) {
                        result.success(false)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        sweepOldShares()
        captureShare(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val shared = captureShare(intent) ?: return
        shareChannel?.invokeMethod("shared", shared, object : MethodChannel.Result {
            override fun success(result: Any?) {
                pendingShare = null
            }

            override fun error(errorCode: String, errorMessage: String?, errorDetails: Any?) {}

            override fun notImplemented() {}
        })
    }

    private fun captureShare(intent: Intent?): Map<String, String>? {
        if (intent?.action != Intent.ACTION_SEND) return null
        val uri = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java)
            ?: return rememberShare(mapOf("error" to "read_failed"))
        val mime = shareMime(intent, uri)
        val copied = copyShare(uri, mime)
        return rememberShare(copied)
    }

    private fun rememberShare(payload: Map<String, String>): Map<String, String> {
        pendingShare = payload
        return payload
    }

    private fun shareMime(intent: Intent, uri: Uri): String {
        val raw = (intent.type ?: contentResolver.getType(uri) ?: "").substringBefore(';').trim().lowercase()
        if (raw == "application/pdf" || raw == "application/x-pdf" || raw.startsWith("image/")) return raw
        if (raw.isNotEmpty() && raw != "application/octet-stream") return raw
        val name = displayName(uri)?.lowercase() ?: ""
        return when {
            name.endsWith(".pdf") -> "application/pdf"
            name.endsWith(".png") -> "image/png"
            name.endsWith(".jpg") || name.endsWith(".jpeg") -> "image/jpeg"
            name.endsWith(".webp") -> "image/webp"
            name.endsWith(".heic") || name.endsWith(".heif") -> "image/heic"
            else -> raw
        }
    }

    private fun displayName(uri: Uri): String? {
        val direct = uri.lastPathSegment
        if (!direct.isNullOrBlank() && direct.contains('.')) return direct
        return try {
            contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (!cursor.moveToFirst()) return null
                val index = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (index < 0) null else cursor.getString(index)
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun copyShare(uri: Uri, mime: String): Map<String, String> {
        val ext = when {
            mime == "application/pdf" || mime == "application/x-pdf" -> "pdf"
            mime == "image/png" -> "png"
            mime == "image/jpeg" || mime == "image/jpg" -> "jpg"
            mime == "image/webp" -> "webp"
            mime == "image/heic" || mime == "image/heif" -> "heic"
            mime.startsWith("image/") -> "img"
            else -> return mapOf("error" to "unsupported")
        }
        val dir = File(cacheDir, "shares").apply { mkdirs() }
        sweepOldShares()
        val out = File(dir, "share-${System.currentTimeMillis()}.$ext")
        val cap = if (ext == "pdf") 80L * 1024 * 1024 else 40L * 1024 * 1024
        try {
            val input = contentResolver.openInputStream(uri) ?: return mapOf("error" to "read_failed")
            var tooBig = false
            input.use { source ->
                FileOutputStream(out).use { target ->
                    val buffer = ByteArray(8192)
                    var total = 0L
                    while (true) {
                        val read = source.read(buffer)
                        if (read < 0) break
                        total += read
                        if (total > cap) {
                            tooBig = true
                            break
                        }
                        target.write(buffer, 0, read)
                    }
                }
            }
            if (tooBig) {
                out.delete()
                return mapOf("error" to "too_large")
            }
            if (!out.exists() || out.length() == 0L) {
                out.delete()
                return mapOf("error" to "empty")
            }
            sweepOldShares(out)
            return mapOf("path" to out.absolutePath, "kind" to if (ext == "pdf") "pdf" else "photo")
        } catch (_: Exception) {
            out.delete()
            return mapOf("error" to "read_failed")
        }
    }

    private fun sweepOldShares(keep: File? = null) {
        val dir = File(cacheDir, "shares")
        if (!dir.isDirectory) return
        val files = dir.listFiles()?.filter { it.isFile && it.absolutePath != keep?.absolutePath }?.sortedBy { it.lastModified() } ?: return
        val cutoff = System.currentTimeMillis() - 12L * 60L * 60L * 1000L
        val overflow = (files.size - 4).coerceAtLeast(0)
        files.forEachIndexed { index, file ->
            if (index < overflow || file.lastModified() < cutoff) file.delete()
        }
    }

    override fun onDestroy() {
        tryStopPrintGuard()
        pipeBroken = true
        cancelledGeneration = writeGeneration
        closeQuietly()
        mainHandler.removeCallbacks(permissionTimeout)
        pendingResult?.let { replyError(it, "closed", "화면이 닫혀 USB를 열지 못했어요.") }
        pendingResult = null
        releaseMulticast()
        try {
            unregisterReceiver(permissionReceiver)
        } catch (_: Exception) {
        }
        try {
            unregisterReceiver(detachReceiver)
        } catch (_: Exception) {
        }
        detachRegistered = false
        io.shutdownNow()
        super.onDestroy()
    }

    private fun acquireMulticast() {
        try {
            if (multicastLock?.isHeld == true) return
            val wifi = applicationContext.getSystemService(WIFI_SERVICE) as WifiManager
            val lock = wifi.createMulticastLock("office_print")
            lock.setReferenceCounted(false)
            lock.acquire()
            multicastLock = lock
        } catch (_: Exception) {
        }
    }

    private fun releaseMulticast() {
        try {
            val lock = multicastLock
            if (lock != null && lock.isHeld) lock.release()
        } catch (_: Exception) {
        }
        multicastLock = null
    }

    private fun replySuccess(result: MethodChannel.Result, value: Any?) {
        mainHandler.post {
            if (isDestroyed) return@post
            try {
                result.success(value)
            } catch (_: Exception) {
            }
        }
    }

    private fun replyError(result: MethodChannel.Result, code: String, message: String) {
        mainHandler.post {
            if (isDestroyed) return@post
            try {
                result.error(code, message, null)
            } catch (_: Exception) {
            }
        }
    }

    private fun tryStartPrintGuard() {
        try {
            val intent = Intent(this, PrintForegroundService::class.java)
            ContextCompat.startForegroundService(this, intent)
        } catch (_: Exception) {
        }
    }

    private fun tryStopPrintGuard() {
        try {
            startService(Intent(this, PrintForegroundService::class.java).setAction(PrintForegroundService.ACTION_STOP))
        } catch (_: Exception) {
        }
    }

    private fun usbManager(): UsbManager = getSystemService(USB_SERVICE) as UsbManager

    private fun listDevices(): List<Map<String, Any>> {
        return usbManager().deviceList.values.map { device ->
            mapOf(
                "deviceId" to device.deviceId,
                "name" to (device.productName ?: device.deviceName),
            )
        }
    }

    private fun requestOpen(deviceId: Int, result: MethodChannel.Result) {
        io.execute {
            val device = usbManager().deviceList.values.firstOrNull { it.deviceId == deviceId }
            if (device == null) {
                replyError(result, "missing", "USB 복사기를 찾지 못했어요.")
                return@execute
            }
            if (usbManager().hasPermission(device)) {
                try {
                    replySuccess(result, openDevice(device))
                } catch (error: Exception) {
                    replyError(result, "usb", error.message ?: "USB 복사기를 열지 못했어요.")
                }
                return@execute
            }
            mainHandler.post {
                if (pendingResult != null) {
                    replyError(result, "busy", "USB 권한 요청이 이미 진행 중이에요.")
                    return@post
                }
                pendingResult = result
                mainHandler.removeCallbacks(permissionTimeout)
                mainHandler.postDelayed(permissionTimeout, 30_000)
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or
                    (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
                val explicit = Intent(permissionAction).setPackage(packageName)
                val pending = PendingIntent.getBroadcast(this, 0, explicit, flags)
                usbManager().requestPermission(device, pending)
            }
        }
    }

    private fun openDevice(device: UsbDevice): Map<String, String> {
        closeQuietly()
        val picked = pickInterface(device) ?: throw IllegalStateException("프린터로 바로 보낼 수 있는 USB 단자가 없어요.")
        val opened = usbManager().openDevice(device) ?: throw IllegalStateException("USB 복사기를 열지 못했어요.")
        if (!opened.claimInterface(picked.usbInterface, true)) {
            opened.close()
            throw IllegalStateException("다른 앱이 USB를 사용 중이라 이 앱에서 바로 보낼 수 없어요.")
        }
        val identity = readIdentity(opened, picked.usbInterface)
        synchronized(usbLock) {
            connection = opened
            claimed = picked.usbInterface
            outEndpoint = picked.endpoint
            usbDeviceId = device.deviceId
            pipeBroken = false
        }
        val parsed = parseIdentity(identity, device)
        return mapOf("query" to parsed.first, "cmd" to parsed.second, "title" to parsed.third, "raw" to identity)
    }

    private data class Picked(val usbInterface: UsbInterface, val endpoint: UsbEndpoint)

    private fun pickInterface(device: UsbDevice): Picked? {
        val found = mutableListOf<Picked>()
        for (index in 0 until device.interfaceCount) {
            val iface = device.getInterface(index)
            if (iface.interfaceClass != UsbConstants.USB_CLASS_PRINTER) continue
            val protocol = iface.interfaceProtocol
            if (protocol != 2 && protocol != 1) continue
            val endpoint = (0 until iface.endpointCount)
                .map { iface.getEndpoint(it) }
                .firstOrNull { it.direction == UsbConstants.USB_DIR_OUT }
                ?: continue
            found.add(Picked(iface, endpoint))
        }
        return found.firstOrNull { it.usbInterface.interfaceProtocol == 2 } ?: found.firstOrNull()
    }

    private fun readIdentity(opened: UsbDeviceConnection, iface: UsbInterface): String {
        val indexes = intArrayOf((iface.id shl 8) or iface.alternateSetting, iface.id)
        for (index in indexes) {
            val buffer = ByteArray(1024)
            val length = opened.controlTransfer(0xA1, 0, 0, index, buffer, buffer.size, 2000)
            if (length > 2) {
                val text = decodeIdentity(buffer, length)
                if (text.isNotEmpty()) return text
            }
        }
        return ""
    }

    private fun decodeIdentity(buffer: ByteArray, length: Int): String {
        val start = if (length > 2) 2 else 0
        val text = String(buffer, start, (length - start).coerceAtLeast(0), Charset.forName("ISO-8859-1"))
        val at = Regex("MFG:|MANUFACTURER:|MDL:|MODEL:", RegexOption.IGNORE_CASE).find(text)?.range?.first ?: 0
        return text.substring(at).trim('\u0000', ' ')
    }

    private fun field(text: String, name: String): String {
        val match = Regex("(?:^|;)\\s*$name\\s*:\\s*([^;]*)", RegexOption.IGNORE_CASE).find(text)
        return match?.groupValues?.getOrNull(1)?.trim() ?: ""
    }

    private fun parseIdentity(text: String, device: UsbDevice): Triple<String, String, String> {
        val mfg = field(text, "MFG").ifEmpty { field(text, "MANUFACTURER") }
        val mdl = field(text, "MDL").ifEmpty { field(text, "MODEL") }
        val cmd = field(text, "CMD")
        val query = when {
            mdl.isEmpty() -> device.productName ?: "USB 복사기"
            mfg.isEmpty() || mdl.startsWith(mfg, ignoreCase = true) -> mdl
            else -> "$mfg $mdl"
        }
        return Triple(query, cmd, query)
    }

    private fun writeBytes(bytes: ByteArray?, result: MethodChannel.Result) {
        val payload = bytes
        val opened = connection
        val endpoint = outEndpoint
        if (payload == null || opened == null || endpoint == null || pipeBroken) {
            result.error("closed", "USB로 바로 넣지는 못해요. 다시 연결해 주세요.", null)
            return
        }
        val generation = synchronized(usbLock) {
            writeGeneration += 1
            writeGeneration
        }
        val replied = AtomicBoolean(false)
        io.execute {
            val deadline = SystemClock.elapsedRealtime() + 15000
            try {
                var offset = 0
                while (offset < payload.size) {
                    if (pipeBroken) throw IllegalStateException("복사기와 연결이 끊어졌어요.")
                    if (cancelledGeneration == generation && offset == 0) {
                        finishWrite(result, replied, null, null)
                        return@execute
                    }
                    val remain = (deadline - SystemClock.elapsedRealtime()).toInt()
                    if (remain <= 0) {
                        throw IllegalStateException("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.")
                    }
                    val slice = if (remain < 2000) remain else 2000
                    val started = SystemClock.elapsedRealtime()
                    val wrote = opened.bulkTransfer(endpoint, payload, offset, payload.size - offset, slice)
                    if (wrote > 0) {
                        val next = offset + wrote
                        if (next > payload.size) throw IllegalStateException("USB 전송이 끊겼어요.")
                        offset = next
                        continue
                    }
                    if (pipeBroken) throw IllegalStateException("복사기와 연결이 끊어졌어요.")
                    if (cancelledGeneration == generation) {
                        finishWrite(result, replied, null, null)
                        return@execute
                    }
                    val elapsed = SystemClock.elapsedRealtime() - started
                    if (elapsed < slice / 2) {
                        throw IllegalStateException("USB 연결이 불안정하거나 끊겼어요.")
                    }
                    if (SystemClock.elapsedRealtime() >= deadline) {
                        throw IllegalStateException("복사기가 15초 안에 받지 않았어요. 용지가 없거나 걸린 것 같아요.")
                    }
                }
                finishWrite(result, replied, null, null)
            } catch (error: Exception) {
                closeQuietly()
                val message = error.message ?: "USB 전송이 끊겼어요."
                finishWrite(result, replied, "write", message)
            }
        }
    }

    private fun finishWrite(result: MethodChannel.Result, replied: AtomicBoolean, code: String?, message: String?) {
        if (!replied.compareAndSet(false, true)) return
        if (code == null) replySuccess(result, null) else replyError(result, code, message ?: "USB 전송이 끊겼어요.")
    }

    private fun closeQuietly() {
        val opened: UsbDeviceConnection?
        val iface: UsbInterface?
        synchronized(usbLock) {
            opened = connection
            iface = claimed
            connection = null
            claimed = null
            outEndpoint = null
            usbDeviceId = -1
        }
        try {
            iface?.let { opened?.releaseInterface(it) }
        } catch (_: Exception) {
        }
        try {
            opened?.close()
        } catch (_: Exception) {
        }
    }
}
