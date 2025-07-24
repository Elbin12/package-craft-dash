import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  loading: false,
};

// Login User
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/service/auth/login/`, credentials,{
        headers: {
            'Content-Type': 'application/json',
        },
      });
      return {
        access: response.data.tokens.access,
        refresh: response.data.tokens.refresh,
        user: response.data.user,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Login Admin
export const loginAdmin = createAsyncThunk(
  'auth/loginAdmin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/admin/login/`, credentials);
      return {
        access: response.data.tokens.access,
        refresh: response.data.tokens.refresh,
        user: response.data.admin,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Admin login failed');
    }
  }
);

// Signup User
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (signupData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup/`, signupData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

// Refresh Token
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const refresh = state.auth.refreshToken;

      if (!refresh) {
        return rejectWithValue('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

// Get User Profile
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.accessToken;

      const response = await axios.get(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

// Logout User
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken, refreshToken } = state.auth;

      if (!accessToken || !refreshToken) return;

      await axios.post(`${API_BASE_URL}/auth/logout/`, { refresh: refreshToken }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Login Admin
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Signup User
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })

      // Get User Profile
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
