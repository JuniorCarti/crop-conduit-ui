package com.example.crop_conduit_mobile

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.example.crop_conduit_mobile.databinding.ActivitySplashBinding

class SplashActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySplashBinding
    private val splashDelayMillis = 2100L
    private val splashHandler = Handler(Looper.getMainLooper())

    private val splashRunnable = Runnable {
        val destination = if (OnboardingPreferences.isOnboardingComplete(this)) {
            MainActivity::class.java
        } else {
            OnboardingActivity::class.java
        }
        startActivity(Intent(this, destination))
        finish()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.Theme_Splash)
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.logoImage.alpha = 0f
        binding.logoImage.scaleX = 0.85f
        binding.logoImage.scaleY = 0.85f
        binding.logoImage.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(800)
            .setStartDelay(100)
            .start()

        binding.splashTitle.alpha = 0f
        binding.splashSubtitle.alpha = 0f
        binding.splashTitle.animate().alpha(1f).setDuration(600).setStartDelay(300).start()
        binding.splashSubtitle.animate().alpha(1f).setDuration(600).setStartDelay(450).start()

        splashHandler.postDelayed(splashRunnable, splashDelayMillis)
    }

    override fun onDestroy() {
        splashHandler.removeCallbacks(splashRunnable)
        super.onDestroy()
    }
}
