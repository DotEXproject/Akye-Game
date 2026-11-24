package com.dotexsolutions.akye;

import android.net.Uri;
import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Trusted Web Activity launcher for the existing Akye PWA.
 * Browser chrome is removed only after Android Digital Asset Links verification.
 * The Play app-signing fingerprint must be published on the game domain.
 */
public final class MainActivity extends LauncherActivity {
    @Override
    protected Uri getLaunchingUrl() {
        return Uri.parse("https://games.dotexsolutions.com/akye/");
    }
}
