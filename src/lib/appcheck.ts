'use client';

import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { app } from './firebase';

let appCheckInitialized = false;

// 💡 FIX 1: Explicitly declare the type of appCheck as AppCheck or null.
export let appCheck: AppCheck | null = null;

export const initializeAppCheckForWeb = () => {
  if (typeof window !== 'undefined' && !appCheckInitialized) {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const reCaptchaKey = process.env.NEXT_PUBLIC_FIREBASE_RECAPTCHA_SITE_KEY;
      
      let providerKey: string;

      if (isDevelopment) {
      // ✅ Enable debug token for development
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'true';
      console.log('App Check debug mode enabled');
      providerKey = 'placeholder-key'; // Ignored in debug mode
    } else {
      // Ensure production key exists
      if (!reCaptchaKey) {
        console.error(
          'ReCaptcha site key is not defined. App Check will not work in production.'
        );
        return;
      }
      providerKey = reCaptchaKey;
    }
      
      // Initialize App Check with the determined key
      const newAppCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(providerKey),
        isTokenAutoRefreshEnabled: true
      });
      
      // Assign the new instance to the exported variable
      appCheck = newAppCheck;
      appCheckInitialized = true;
      console.log('App Check initialized successfully.');
      console.log('Using reCAPTCHA key:', reCaptchaKey?.substring(0, 10) + '...');
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  }
  
};

if (typeof window !== 'undefined') {
  initializeAppCheckForWeb();
}