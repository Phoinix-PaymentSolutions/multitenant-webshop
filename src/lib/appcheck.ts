'use client';

import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { app } from './firebase';

let appCheckInitialized = false;

export const initializeAppCheckForDevelopment = () => {
  if (typeof window !== 'undefined' && !appCheckInitialized) {
    // Enable debug token for development
    if (process.env.NODE_ENV === 'development') {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      console.log('App Check debug mode enabled');
    }
    
    try {
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider('placeholder-key'),
        isTokenAutoRefreshEnabled: true
      });
      
      appCheckInitialized = true;
      console.log('App Check initialized successfully');
    } catch (error) {
      console.error('App Check initialization failed:', error);
    }
  }
};

// Auto-initialize when this module loads in the browser
if (typeof window !== 'undefined') {
  initializeAppCheckForDevelopment();
}