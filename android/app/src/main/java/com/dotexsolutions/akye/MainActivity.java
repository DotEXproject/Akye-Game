package com.dotexsolutions.akye;

import android.app.Activity;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;

/**
 * Android launcher for the live Akye game.
 * This is a Custom Tab fallback while the signed TWA + Digital Asset Links
 * verification is being completed. Do not describe it as a verified TWA.
 */
public final class MainActivity extends Activity {
    private static final String GAME_URL = "https://games.dotexsolutions.com/akye/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        CustomTabsIntent intent = new CustomTabsIntent.Builder()
                .setShowTitle(false)
                .build();
        intent.launchUrl(this, Uri.parse(GAME_URL));
        finish();
    }
}
