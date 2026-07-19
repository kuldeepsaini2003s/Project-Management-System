import { authService } from "../../services/authService.js";
import { setUser, setAuthLoading, clearUser } from "../authSlice.js";
import { TOKEN_KEY } from "../../utils/constants.js";

// Hydrate the session from a stored token on app load.
export const loadCurrentUser = () => async (dispatch) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    dispatch(setAuthLoading(false));
    return;
  }
  try {
    const user = await authService.me();
    dispatch(setUser(user));
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    dispatch(clearUser());
  }
};

const persistSession = (dispatch, { user, token }) => {
  localStorage.setItem(TOKEN_KEY, token);
  dispatch(setUser(user));
  return user;
};

export const loginWithEmail = (email, password) => async (dispatch) => {
  const data = await authService.login({ email, password });
  return persistSession(dispatch, data);
};

export const registerWithEmail = (payload) => async (dispatch) => {
  const data = await authService.register(payload);
  return persistSession(dispatch, data);
};

export const loginWithGoogle = (accessToken) => async (dispatch) => {
  const data = await authService.google(accessToken);
  return persistSession(dispatch, data);
};

export const logout = () => async (dispatch) => {
  // Tell the server to delete this session BEFORE clearing the local token —
  // the request needs the still-present token to identify which session to
  // remove. Previously this only cleared localStorage, so the session kept
  // showing as "active" on the Security page (and the token itself stayed
  // technically valid) until it naturally expired 7 days later.
  await authService.logout();
  localStorage.removeItem(TOKEN_KEY);
  dispatch(clearUser());
};
