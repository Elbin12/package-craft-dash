import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';

// Replace this with your actual login action
import { loginUser } from '../../store/slices/authSlice';

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(()=>{
    if (success) {
      navigate('/admin');
    }
  },[success, navigate]);

  // Ensure body, html, and root background is light for login page
  // This fixes the dark screen issue on some browsers/PCs where CSS variables
  // or Tailwind's bg-background class might not resolve correctly
  useEffect(() => {
    const rootElement = document.getElementById('root');
    const originalBodyBackground = document.body.style.background;
    const originalBodyColor = document.body.style.color;
    const originalHtmlBackground = document.documentElement.style.background;
    const originalRootBackground = rootElement ? rootElement.style.background : '';
    const originalRootMaxWidth = rootElement ? rootElement.style.maxWidth : '';
    const originalRootPadding = rootElement ? rootElement.style.padding : '';
    const hadDarkOnHtml = document.documentElement.classList.contains('dark');
    const hadDarkOnBody = document.body.classList.contains('dark');
    
    // Force light background on html, body, and root with !important
    // Using setProperty with important flag for maximum specificity
    document.documentElement.style.setProperty('background', '#f5f5f5', 'important');
    document.documentElement.style.setProperty('background-color', '#f5f5f5', 'important');
    document.body.style.setProperty('background', '#f5f5f5', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
    document.body.style.setProperty('color', '#000', 'important');
    
    // Also ensure root element has proper background and doesn't constrain layout
    if (rootElement) {
      rootElement.style.setProperty('background', '#f5f5f5', 'important');
      rootElement.style.setProperty('background-color', '#f5f5f5', 'important');
      rootElement.style.setProperty('max-width', '100%', 'important');
      rootElement.style.setProperty('padding', '0', 'important');
      rootElement.style.setProperty('margin', '0', 'important');
    }
    
    // Remove dark class if present
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    if (rootElement) {
      rootElement.classList.remove('dark');
    }
    
    return () => {
      // Restore original styles on unmount
      if (originalHtmlBackground) {
        document.documentElement.style.background = originalHtmlBackground;
      } else {
        document.documentElement.style.removeProperty('background');
        document.documentElement.style.removeProperty('background-color');
      }
      if (originalBodyBackground) {
        document.body.style.background = originalBodyBackground;
      } else {
        document.body.style.removeProperty('background');
        document.body.style.removeProperty('background-color');
      }
      document.body.style.removeProperty('color');
      
      if (rootElement) {
        if (originalRootBackground) {
          rootElement.style.background = originalRootBackground;
        } else {
          rootElement.style.removeProperty('background');
          rootElement.style.removeProperty('background-color');
        }
        if (originalRootMaxWidth) {
          rootElement.style.maxWidth = originalRootMaxWidth;
        } else {
          rootElement.style.removeProperty('max-width');
        }
        if (originalRootPadding) {
          rootElement.style.padding = originalRootPadding;
        } else {
          rootElement.style.removeProperty('padding');
        }
        rootElement.style.removeProperty('margin');
      }
      
      if (hadDarkOnHtml) {
        document.documentElement.classList.add('dark');
      }
      if (hadDarkOnBody) {
        document.body.classList.add('dark');
      }
    };
  }, []);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('username is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      await dispatch(loginUser(values));
    },
  });

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        zIndex: 9999,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 3,
          boxShadow: 4,
          borderRadius: 3,
          backgroundColor: '#ffffff',
        }}
      >
        <CardContent>
          <Box mb={3} textAlign="center">
            <Typography variant="h5" fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          <form onSubmit={formik.handleSubmit} noValidate>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="username"
                variant="outlined"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
              />
            </Box>

            <Box mb={2}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            </Box>

            {error && (
              <Typography variant="body2" color="error" mb={2}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 'bold', mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don't have an account?{' '}
              <MuiLink component={Link} to="/signup" color="primary">
                Sign up
              </MuiLink>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserLogin;
