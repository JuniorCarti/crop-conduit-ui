package com.example.crop_conduit_mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.viewpager2.widget.ViewPager2
import com.example.crop_conduit_mobile.databinding.ActivityOnboardingBinding
import com.google.android.material.tabs.TabLayoutMediator

class OnboardingActivity : AppCompatActivity() {
    private lateinit var binding: ActivityOnboardingBinding
    private lateinit var adapter: OnboardingAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOnboardingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val onboardingPages = listOf(
            OnboardingItem(
                title = getString(R.string.screen_one_title),
                description = getString(R.string.screen_one_description),
                imageRes = R.drawable.ic_onboarding_climate
            ),
            OnboardingItem(
                title = getString(R.string.screen_two_title),
                description = getString(R.string.screen_two_description),
                imageRes = R.drawable.ic_onboarding_market
            ),
            OnboardingItem(
                title = getString(R.string.screen_three_title),
                description = getString(R.string.screen_three_description),
                imageRes = R.drawable.ic_onboarding_growth
            )
        )

        adapter = OnboardingAdapter(onboardingPages)
        binding.viewPager.adapter = adapter
        binding.viewPager.offscreenPageLimit = 1

        TabLayoutMediator(binding.indicatorTabLayout, binding.viewPager) { _, _ -> }.attach()

        binding.skipButton.setOnClickListener { completeOnboarding() }
        binding.nextButton.setOnClickListener { onNextClicked(onboardingPages) }

        binding.viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                updatePageState(position, onboardingPages)
            }
        })

        updatePageState(0, onboardingPages)
    }

    private fun updatePageState(position: Int, pages: List<OnboardingItem>) {
        binding.progressText.text = getString(R.string.onboarding_progress_format, position + 1)
        binding.nextButton.text = if (position == pages.lastIndex) {
            getString(R.string.get_started)
        } else {
            getString(R.string.next)
        }
    }

    private fun onNextClicked(pages: List<OnboardingItem>) {
        val currentPosition = binding.viewPager.currentItem
        if (currentPosition < pages.lastIndex) {
            binding.viewPager.currentItem = currentPosition + 1
        } else {
            completeOnboarding()
        }
    }

    private fun completeOnboarding() {
        OnboardingPreferences.setOnboardingComplete(this, true)
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
