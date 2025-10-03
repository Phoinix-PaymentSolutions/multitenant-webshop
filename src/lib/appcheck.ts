'use client';

import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck, onTokenChanged, AppCheckTokenResult } from 'firebase/app-check';
import { app } from './firebase';

let appCheckInitialized = false;

// We declare the appCheck variable to store the initialized instance.
export let appCheck: AppCheck | null = null;

export const initializeAppCheckForWeb = () => {
  // We only want to run this code in the browser and once per page load.
  if (typeof window !== 'undefined' && !appCheckInitialized) {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const reCaptchaKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;
      
      let providerKey: string;

      if (isDevelopment) {
        // FIXED: Set as boolean true, not string 'true'
        // FIXED: Use self.FIREBASE_APPCHECK_DEBUG_TOKEN instead of window.FIREBASE_APPCHECK_DEBUG_TOKEN
        (window as any).self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.log('App Check debug mode enabled. A debug token will be generated.');
        // The provider key is not used in debug mode, but the provider is still required.
        providerKey = 'placeholder-key';
      } else {
        // Ensure the production key exists.
        if (!reCaptchaKey) {
          console.error(
            'ReCaptcha site key is not defined. App Check will not work in production.'
          );
          return;
        }
        providerKey = reCaptchaKey;
      }
      
      // Initialize App Check with the appropriate provider and key.
      const newAppCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(providerKey),
        isTokenAutoRefreshEnabled: true
      });
      
      appCheck = newAppCheck;
      appCheckInitialized = true;
      
      // Use the onTokenChanged listener to reliably get the debug token.
      if (isDevelopment && appCheck) {
        onTokenChanged(appCheck, (tokenResponse: AppCheckTokenResult) => {
          console.log("App Check debug token:", tokenResponse.token);
          console.log("Copy this token to your Firebase console for debugging");
        });
      }
      
      console.log('App Check initialized successfully.');
      console.log('Using reCAPTCHA key:', reCaptchaKey ? reCaptchaKey.substring(0, 10) + '...' : 'none');
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  }
};

if (typeof window !== 'undefined') {
  initializeAppCheckForWeb();
}