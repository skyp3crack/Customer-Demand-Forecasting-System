import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  CircularProgress, 
  Alert, 
  Paper,
  Divider,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  Fade,
  useTheme,
  alpha,
  Stack,
  Grid
} from '@mui/material';
import {
  PhotoCamera, 
  Visibility, 
  VisibilityOff, 
  Person, 
  Security, 
  Email, 
  Phone, 
  Edit,
  CheckCircle,
  Cancel,
  CloudUpload
} from '@mui/icons-material';
import useToast from '@/hooks/useToast';

const defaultProfileImg = '/src/assets/profile-image.jpg';

const UserProfileSettings = () => {
  const { user, api, updateUser } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    image: null,
    previewImage: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Function to get the correct profile image URL or imported image
  const getProfileImageUrl = (imagePath) => {
    // If no image path, return the default imported image
    if (!imagePath) {
      return defaultProfileImg;
    }
    
    // If it's already a full URL (for social logins), use it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a path starting with /uploads/profile-images, serve from /profile-images
    if (imagePath.startsWith('/uploads/profile-images/')) {
      return `http://localhost:3000${imagePath.replace('/uploads', '')}`;
    }
    
    // If it's a path starting with /uploads, serve from /uploads
    if (imagePath.startsWith('/uploads/')) {
      return `http://localhost:3000${imagePath}`;
    }
    
    // If it's a path to frontend assets or default image, return the imported default image
    if (imagePath.includes('profile-image.jpg') || imagePath.includes('/src/assets/') || imagePath === 'profile-image.jpg') {
      return defaultProfileImg;
    }
    
    // For any other local paths, assume they're from the backend
    return `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        previewImage: getProfileImageUrl(user.image || '')
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, GIF)');
        return;
      }
      
      if (file.size > maxSize) {
        setError('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          previewImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      if (formData.name !== user.name) formDataToSend.append('name', formData.name);
      if (formData.phone !== user.phone) formDataToSend.append('phone', formData.phone);
      if (formData.image) formDataToSend.append('image', formData.image);

      if (formDataToSend.entries().next().done) {
        setSuccess('No changes to save');
        setLoading(false);
        return;
      }

      const response = await api.patch('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        const successMsg = 'Profile updated successfully!';
        setSuccess(successMsg);
        // Update the user context with the new data
        updateUser({
          ...user, // Keep existing user data
          name: response.data.name || user.name,
          phone: response.data.phone || user.phone,
          image: response.data.image || user.image
        });
        // Update the form data to reflect the changes
        setFormData(prev => ({
          ...prev,
          name: response.data.name || prev.name,
          phone: response.data.phone || prev.phone,
          previewImage: response.data.image ? getProfileImageUrl(response.data.image) : prev.previewImage
        }));
        setIsEditing(false);
        toast.success(successMsg);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMsg = err.response?.data?.message || 'An error occurred while updating your profile';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      const errorMsg = 'New passwords do not match';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      const errorMsg = 'Password must be at least 8 characters';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
      return;
    }

    try {
      await api.patch('/users/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      const successMsg = 'Password changed successfully!';
      setPasswordSuccess(successMsg);
      toast.success(successMsg);
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Error changing password:', err);
      const errorMsg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={40} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading user data...</Typography>
      </Box>
    );
  }

  const TabButton = ({ active, onClick, icon, label, color = 'primary' }) => (
    <Button
      onClick={onClick}
      startIcon={icon}
      variant={active ? 'contained' : 'outlined'}
      sx={{
        minWidth: 140,
        height: 48,
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: 3,
        border: active ? 'none' : `2px solid ${alpha(theme.palette[color].main, 0.2)}`,
        bgcolor: active ? theme.palette[color].main : 'transparent',
        color: active ? 'white' : theme.palette[color].main,
        '&:hover': {
          bgcolor: active ? theme.palette[color].dark : alpha(theme.palette[color].main, 0.1),
          transform: 'translateY(-2px)',
          boxShadow: active ? theme.shadows[8] : `0 4px 12px ${alpha(theme.palette[color].main, 0.3)}`,
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {label}
    </Button>
  );

  return (
    <Box sx={{ p: 4 }}>
      {/* Tab Navigation */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
        <TabButton
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          icon={<Person />}
          label="Profile"
        />
        <TabButton
          active={activeTab === 'password'}
          onClick={() => setActiveTab('password')}
          icon={<Security />}
          label="Security"
          color="secondary"
        />
      </Box>

      <Fade in={true} timeout={600}>
        <Box>
          {activeTab === 'profile' ? (
            <Card
              elevation={0}
              sx={{
                maxWidth: 900,
                mx: 'auto',
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Profile Information
                  </Typography>
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? 'outlined' : 'contained'}
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                    }}
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </Box>

                {error && (
                  <Fade in={true}>
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 2 }} 
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  </Fade>
                )}
                
                {success && (
                  <Fade in={true}>
                    <Alert 
                      severity="success" 
                      sx={{ mb: 3, borderRadius: 2 }} 
                      onClose={() => setSuccess('')}
                    >
                      {success}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handleProfileSubmit}>
                  <Grid container spacing={4}>
                    {/* Profile Picture Section */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ position: 'relative', mb: 3 }}>
                          <Avatar
                            src={formData.previewImage}
                            alt={formData.name}
                            sx={{ 
                              width: 160, 
                              height: 160, 
                              fontSize: '4rem',
                              bgcolor: theme.palette.primary.main,
                              border: `4px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                          >
                            {!formData.previewImage || formData.previewImage === defaultProfileImg ? (formData.name?.[0]?.toUpperCase() || 'U') : null}
                          </Avatar>
                          
                          {isEditing && (
                            <Box sx={{ position: 'absolute', bottom: -8, right: -8 }}>
                              <input
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="profile-image-upload"
                                type="file"
                                onChange={handleImageChange}
                              />
                              <label htmlFor="profile-image-upload">
                                <IconButton
                                  color="primary"
                                  aria-label="upload picture"
                                  component="span"
                                  sx={{
                                    bgcolor: theme.palette.primary.main,
                                    color: 'white',
                                    width: 48,
                                    height: 48,
                                    '&:hover': { 
                                      bgcolor: theme.palette.primary.dark,
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                    boxShadow: theme.shadows[4],
                                  }}
                                >
                                  <CloudUpload />
                                </IconButton>
                              </label>
                            </Box>
                          )}
                        </Box>
                        
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {formData.name || 'User'}
                        </Typography>
                        
                        <Chip 
                          label="Active"
                          color="success"
                          size="small"
                          icon={<CheckCircle sx={{ fontSize: 16 }} />}
                          sx={{ borderRadius: 2 }}
                        />
                        
                        {isEditing && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ mt: 2, textAlign: 'center' }}
                          >
                            JPG, PNG, or GIF<br />
                            Maximum 5MB
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Form Fields Section */}
                    <Grid item xs={12} md={8}>
                      <Stack spacing={3}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading || !isEditing}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        />
                        
                        <TextField
                          fullWidth
                          label="Email Address"
                          name="email"
                          value={formData.email}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email color="action" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.action.disabled, 0.05),
                            },
                          }}
                          helperText="Email cannot be changed"
                        />
                        
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={loading || !isEditing}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Phone color="action" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                          helperText="Include country code (e.g., +1)"
                        />
                      </Stack>
                      
                      {isEditing && (
                        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              // Reset form data to current user data
                              setFormData({
                                name: user.name || '',
                                email: user.email || '',
                                phone: user.phone || '',
                                image: null,
                                previewImage: getProfileImageUrl(user.image || '')
                              });
                              setError('');
                              setSuccess('');
                              setIsEditing(false);
                            }}
                            disabled={loading}
                            startIcon={<Cancel />}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                            sx={{
                              borderRadius: 3,
                              textTransform: 'none',
                              fontWeight: 600,
                              px: 3,
                              boxShadow: theme.shadows[4],
                              '&:hover': {
                                boxShadow: theme.shadows[8],
                              },
                            }}
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card
              elevation={0}
              sx={{
                maxWidth: 600,
                mx: 'auto',
                borderRadius: 4,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 3 }}>
                  Change Password
                </Typography>
                
                {passwordError && (
                  <Fade in={true}>
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 2 }} 
                      onClose={() => setPasswordError('')}
                    >
                      {passwordError}
                    </Alert>
                  </Fade>
                )}
                
                {passwordSuccess && (
                  <Fade in={true}>
                    <Alert 
                      severity="success" 
                      sx={{ mb: 3, borderRadius: 2 }} 
                      onClose={() => setPasswordSuccess('')}
                    >
                      {passwordSuccess}
                    </Alert>
                  </Fade>
                )}

                <Box component="form" onSubmit={handlePasswordSubmit}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => togglePasswordVisibility('current')}
                              edge="end"
                            >
                              {showPassword.current ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => togglePasswordVisibility('new')}
                              edge="end"
                            >
                              {showPassword.new ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                      helperText="Must be at least 8 characters"
                    />
                    
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => togglePasswordVisibility('confirm')}
                              edge="end"
                            >
                              {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Stack>
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        boxShadow: theme.shadows[4],
                        '&:hover': {
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Fade>
    </Box>
  );
};

export default UserProfileSettings;