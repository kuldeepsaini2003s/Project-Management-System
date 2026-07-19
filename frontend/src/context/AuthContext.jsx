import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadCurrentUser,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle as loginWithGoogleThunk,
  logout as logoutThunk,
} from "../redux/actions/authActions.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadCurrentUser());
  }, [dispatch]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login: (email, password) => dispatch(loginWithEmail(email, password)),
    register: (payload) => dispatch(registerWithEmail(payload)),
    loginWithGoogle: (accessToken) => dispatch(loginWithGoogleThunk(accessToken)),
    logout: () => dispatch(logoutThunk()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
