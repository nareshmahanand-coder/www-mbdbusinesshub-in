import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    grecaptcha?: {
      reset: (widgetId?: number) => void;
    };
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyBfdOA2dNmXMQelLzGSGJKZi08AwE4B8ek",
  authDomain: "mera-bharat-dukaan.firebaseapp.com",
  projectId: "mera-bharat-dukaan",
  storageBucket: "mera-bharat-dukaan.firebasestorage.app",
  messagingSenderId: "577491645171",
  appId: "1:577491645171:web:8f25a81fc8302ae62e3d86",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;

export const clearRecaptcha = (containerId?: string): void => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  recaptchaWidgetId = null;

  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
    }
  }
};

export const setupRecaptcha = (containerId: string): Promise<RecaptchaVerifier> => {
  clearRecaptcha(containerId);

  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "normal",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      // reCAPTCHA expired
    },
  });

  return recaptchaVerifier.render()
    .then((widgetId) => {
      recaptchaWidgetId = widgetId;
      return recaptchaVerifier!;
    })
    .catch((error) => {
      clearRecaptcha(containerId);
      throw error;
    });
};

export const renderRecaptcha = async (containerId: string): Promise<void> => {
  if (recaptchaVerifier && recaptchaWidgetId !== null) {
    return;
  }

  await setupRecaptcha(containerId);
};

export const resetRecaptcha = async (containerId: string): Promise<void> => {
  if (recaptchaVerifier && recaptchaWidgetId !== null && window.grecaptcha) {
    window.grecaptcha.reset(recaptchaWidgetId);
    return;
  }

  await setupRecaptcha(containerId);
};

export const sendOtp = async (phoneNumber: string): Promise<ConfirmationResult> => {
  if (!recaptchaVerifier) {
    throw new Error("reCAPTCHA not initialized. Please complete the reCAPTCHA first.");
  }

  if (recaptchaWidgetId === null) {
    recaptchaWidgetId = await recaptchaVerifier.render();
  }

  try {
    await recaptchaVerifier.verify();
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "reCAPTCHA verification failed. Please complete the checkbox and try again.";

    throw new Error(message);
  }

  try {
    return await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to request OTP.");
  }
};

export type { ConfirmationResult };
