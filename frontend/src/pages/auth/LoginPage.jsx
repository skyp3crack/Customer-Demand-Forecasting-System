import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Checkbox,
  FormControlLabel,
  Divider,
  Paper,
  Alert,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
  keyframes,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';

// Define keyframes for pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.05;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.05;
  }
`;

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Submitting login form...');
      const success = await login(formData.email, formData.password);
      
      if (success) {
        console.log('Login successful, navigating to dashboard...');
        navigate('/dashboard');
      } else {
        console.log('Login failed, showing error');
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'white' }}>
      {/* Left Section - Login Form */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 3 },
        width: { xs: '100%', md: '50%' },
        maxWidth: '500px',
        mx: 'auto'
      }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, fontSize: '0.75rem' }}>
          Enter your email and password to sign in!
        </Typography>

        {/* Social Login Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={
              <img 
                src="https://storage.googleapis.com/a1aa/image/b95031e1-4102-4dd8-d12c-d48001286126.jpg" 
                alt="Google logo" 
                style={{ width: 20, height: 20 }}
              />
            }
            sx={{ 
              borderColor: 'grey.200',
              color: 'text.primary',
              '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.300' },
              fontSize: '0.875rem',
              py: 1
            }}
          >
            Sign in with Google
          </Button>
          
        </Box>

        {/* Divider */}
        <Box sx={{ position: 'relative', textAlign: 'center', my: 3 }}>
          <Divider />
          <Typography
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'white',
              px: 2,
              color: 'text.secondary',
              fontSize: '0.75rem'
            }}
          >
            Or
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography 
              component="label" 
              htmlFor="email" 
              sx={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 0.5
              }}
            >
              Email <Typography component="span" color="error">*</Typography>
            </Typography>
            <TextField
              fullWidth
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="info@gmail.com"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: 'grey.200' },
                  '&:hover fieldset': { borderColor: 'grey.300' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />
          </Box>

          <Box>
            <Typography 
              component="label" 
              htmlFor="password" 
              sx={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 0.5
              }}
            >
              Password <Typography component="span" color="error">*</Typography>
            </Typography>
            <TextField
              fullWidth
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: 'grey.200' },
                  '&:hover fieldset': { borderColor: 'grey.300' },
                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                }
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  size="small"
                  sx={{ 
                    '& .MuiSvgIcon-root': { fontSize: 16 },
                    color: 'text.secondary'
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  Keep me logged in
                </Typography>
              }
            />
            <Link 
              href="/forgot-password" 
              sx={{ 
                fontSize: '0.75rem', 
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 1,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            Sign In
          </Button>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 3, textAlign: 'center' }}>
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            Sign Up
          </Link>
        </Typography>
      </Box>

      {/* Right Section - Full Height Image */}
      <Box 
        sx={{ 
          display: { xs: 'none', md: 'block' },
          width: '50%',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          component="img"
          src="/images/e49f8422-3d30-4821-8109-16c1c78c8994.webp"
          alt="Login Background"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        {/* Optional: Add a dark overlay for better text readability if needed */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        />
      </Box>
    </Box>
  );
};

export default LoginPage;
