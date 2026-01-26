/**
 * Firebase Authentication Context
 * Provides authentication state and methods throughout the app
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import { getUserLanguage, setUserLanguage } from "@/services/firestore-users";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<{ user: User }>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ user: User }>;
  signInWithPhone: (phoneNumber: string) => Promise<ConfirmationResult>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<{ user: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  // Get Firebase error message
  const getErrorMessage = (error: any): string => {
    switch (error.code) {
      case "auth/invalid-email":
        return t("auth.errors.invalidEmail");
      case "auth/user-disabled":
        return t("auth.errors.userDisabled");
      case "auth/user-not-found":
        return t("auth.errors.userNotFound");
      case "auth/wrong-password":
        return t("auth.errors.wrongPassword");
      case "auth/email-already-in-use":
        return t("auth.errors.emailInUse");
      case "auth/weak-password":
        return t("auth.errors.weakPassword");
      case "auth/network-request-failed":
        return t("auth.errors.network");
      case "auth/too-many-requests":
        return t("auth.errors.tooManyRequests");
      case "auth/invalid-phone-number":
        return t("auth.errors.invalidPhone");
      case "auth/invalid-verification-code":
        return t("auth.errors.invalidOtp");
      case "auth/code-expired":
        return t("auth.errors.otpExpired");
      default:
        return error.message || t("auth.errors.generic");
    }
  };

  // Sign up with email and password
  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
      
      toast.success(t("auth.signupSuccess"));
      return { user: userCredential.user };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success(t("auth.loginSuccess"));
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success(t("auth.logoutSuccess"));
    } catch (error: any) {
      toast.error(t("auth.errors.generic"));
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t("auth.passwordResetSent"));
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });
      const result = await signInWithPopup(auth, provider);
      toast.success(t("auth.loginSuccess"));
      return { user: result.user };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign in with phone number (sends OTP)
  const signInWithPhone = async (phoneNumber: string): Promise<ConfirmationResult> => {
    try {
      // Create reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber
        },
      });

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      toast.success(t("auth.phoneOtpSent"));
      return confirmationResult;
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Verify phone OTP
  const verifyPhoneOTP = async (confirmationResult: ConfirmationResult, otp: string) => {
    try {
      const result = await confirmationResult.confirm(otp);
      toast.success(t("auth.phoneVerified"));
      return { user: result.user };
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const syncLanguage = async () => {
      try {
        const storedLanguage =
          typeof window !== "undefined"
            ? (window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as "en" | "sw" | null)
            : null;
        const userLanguage = await getUserLanguage(currentUser.uid);

        if (userLanguage) {
          i18n.changeLanguage(userLanguage);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, userLanguage);
          }
          return;
        }

        const fallbackLanguage = storedLanguage === "sw" ? "sw" : "en";
        await setUserLanguage(currentUser.uid, fallbackLanguage);
        i18n.changeLanguage(fallbackLanguage);
      } catch {
        // Non-blocking
      }
    };

    syncLanguage();
  }, [currentUser?.uid, i18n]);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

