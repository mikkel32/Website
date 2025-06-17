import React, {
  createContext,
  useContext,
  useReducer,
  useEffect
} from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm'

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const API_BASE_URL = `${window.location.origin}/api`;

  const apiRequest = async (path, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    } catch (_) {
      return { ok: false, data: { error: 'Network error. Please check your connection.' } };
    }
  };

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('auth_token');
    if (token) {
      verifyToken(token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyToken = async (token) => {
    const { ok, data } = await apiRequest('/auth/verify-token', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (ok) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token } });
    } else {
      localStorage.removeItem('auth_token');
      dispatch({ type: 'LOGOUT' });
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const login = React.useCallback(async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    const { ok, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (ok) {
      localStorage.setItem('auth_token', data.access_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.access_token } });
      return { success: true, data };
    }
    dispatch({ type: 'LOGIN_FAILURE', payload: data.error });
    return { success: false, error: data.error };
  }, []);

  const register = React.useCallback(async (username, email, password) => {
    dispatch({ type: 'LOGIN_START' });
    const { ok, data } = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });
    if (ok) {
      return { success: true, data };
    }
    dispatch({ type: 'LOGIN_FAILURE', payload: data.error });
    return { success: false, error: data.error };
  }, []);

  const logout = React.useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const changePassword = React.useCallback(async (currentPassword, newPassword) => {
    const { ok, data } = await apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    if (ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  }, []);

  const clearError = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = React.useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      changePassword,
      clearError
    }),
    [state, login, register, logout, changePassword, clearError]
  );

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

