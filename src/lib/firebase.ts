import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

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

export const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });
  return recaptchaVerifier;
};

export const sendOtp = async (phoneNumber: string, containerId: string): Promise<ConfirmationResult> => {
  const verifier = setupRecaptcha(containerId);
  return signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier);
};

export type { ConfirmationResult };
