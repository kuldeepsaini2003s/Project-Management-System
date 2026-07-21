import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext.jsx";
import { loginWithGoogleCredential } from "../../redux/actions/authActions.js";
import { setOneTapInProgress, setOneTapError } from "../../redux/authSlice.js";

function OneTapPrompt() {
  const dispatch = useDispatch();
  const submittingRef = useRef(false);
  const fallbackTimerRef = useRef(null);

  const clearFallbackTimer = () => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  };

  // Clear the safety timer if the component unmounts (e.g. login completed).
  useEffect(() => clearFallbackTimer, []);

  useGoogleOneTapLogin({
    use_fedcm_for_prompt: true,
    cancel_on_tap_outside: false,
    auto_select: false,
   
    promptMomentNotification: (notification) => {
      try {
        if (!notification?.isDismissedMoment?.()) return;
        const reason = notification?.getDismissedReason?.();
        if (reason && reason !== "credential_returned") return;
        dispatch(setOneTapInProgress(true));
        clearFallbackTimer();
        fallbackTimerRef.current = setTimeout(() => {
          if (!submittingRef.current) dispatch(setOneTapInProgress(false));
        }, 10000);
      } catch {
      }
    },
    onSuccess: async (credentialResponse) => {
      clearFallbackTimer();
      const credential = credentialResponse?.credential;
      if (!credential || submittingRef.current) return;
      submittingRef.current = true;
      dispatch(setOneTapInProgress(true));
      try {
        await dispatch(loginWithGoogleCredential(credential));
      } catch (err) {
        console.error("Google One Tap sign-in failed:", err);
        dispatch(
          setOneTapError(err?.message || "Google sign-in failed. Please try again.")
        );
      } finally {
        submittingRef.current = false;
        dispatch(setOneTapInProgress(false));
      }
    },
    onError: () => {
      clearFallbackTimer();
      dispatch(setOneTapInProgress(false));
    },
  });

  return null;
}

export default function GoogleOneTap() {
  const { isAuthenticated, loading } = useAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (loading || isAuthenticated || !clientId) return null;

  return <OneTapPrompt />;
}
