package com.example.crop_conduit_mobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.example.crop_conduit_mobile.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.welcomeTitle.text = getString(R.string.main_screen_title)
        binding.welcomeSubtitle.text = getString(R.string.main_screen_subtitle)
        binding.featureOneTitle.text = getString(R.string.feature_market)
        binding.featureTwoTitle.text = getString(R.string.feature_climate)
        binding.featureThreeTitle.text = getString(R.string.feature_growth)
    }
}