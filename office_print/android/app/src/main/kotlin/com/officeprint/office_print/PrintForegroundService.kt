package com.officeprint.office_print

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/// 인쇄 중 화면이 꺼져도 프로세스가 바로 죽지 않게 붙잡는 짧은 포그라운드 알림.
class PrintForegroundService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val started = try {
            val notification = buildNotification()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            true
        } catch (_: Exception) {
            false
        }
        if (!started || intent?.action == ACTION_STOP) {
            stopQuietly()
        }
        return START_NOT_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        stopQuietly()
        super.onTaskRemoved(rootIntent)
    }

    override fun onTimeout(startId: Int) {
        stopQuietly()
    }

    override fun onTimeout(startId: Int, fgsType: Int) {
        stopQuietly()
    }

    override fun onDestroy() {
        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } catch (_: Exception) {
        }
        super.onDestroy()
    }

    private fun stopQuietly() {
        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } catch (_: Exception) {
        }
        stopSelf()
    }

    private fun buildNotification(): Notification {
        val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "바로 인쇄", NotificationManager.IMPORTANCE_LOW)
            channel.setShowBadge(false)
            manager.createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("바로 인쇄")
            .setContentText("바로 인쇄 중...")
            .setSmallIcon(android.R.drawable.stat_sys_upload)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build()
    }

    companion object {
        const val ACTION_STOP = "com.officeprint.office_print.STOP_PRINT_GUARD"
        private const val CHANNEL_ID = "office_print_job"
        private const val NOTIFICATION_ID = 4100
    }
}
