import { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Container, 
  Paper, 
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Person, 
  Security, 
  Notifications, 
  AccountCircle 
} from '@mui/icons-material';
import UserProfileSettings from '@/components/settings/UserProfileSettings';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Define settings tabs with icons
  const settingsTabs = [
    { 
      label: 'Profile', 
      icon: <Person />, 
      component: <UserProfileSettings />,
      description: 'Manage your personal information and profile picture'
    },
    // Future tabs - uncomment when ready
    // { 
    //   label: 'Account', 
    //   icon: <AccountCircle />, 
    //   component: <AccountSettings />,
    //   description: 'Account settings and preferences'
    // },
    // { 
    //   label: 'Security', 
    //   icon: <Security />, 
    //   component: <SecuritySettings />,
    //   description: 'Password and security settings'
    // },
    // { 
    //   label: 'Notifications', 
    //   icon: <Notifications />, 
    //   component: <NotificationSettings />,
    //   description: 'Manage your notification preferences'
    // },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: alpha(theme.palette.primary.main, 0.02),
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '1.1rem',
              color: (theme) => alpha(theme.palette.primary.main, 0.8)
            }}
          >
            Manage your account settings and preferences
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* Sidebar Navigation */}
          <Paper 
            elevation={0}
            sx={{ 
              width: { xs: '100%', lg: 280 },
              height: 'fit-content',
              p: 2,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.4)})`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    minHeight: 48,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }
                }}
              >
                {settingsTabs.map((tab, index) => (
                  <Tab 
                    key={index} 
                    icon={tab.icon}
                    iconPosition="start"
                    label={tab.label}
                    sx={{
                      color: activeTab === index ? theme.palette.primary.main : theme.palette.text.secondary,
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Desktop Sidebar */}
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              {settingsTabs.map((tab, index) => (
                <Box
                  key={index}
                  onClick={() => setActiveTab(index)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: activeTab === index 
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    border: activeTab === index 
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      : '1px solid transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateX(4px)',
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      color: activeTab === index ? theme.palette.primary.main : theme.palette.text.secondary,
                      mr: 2,
                      mt: 0.5
                    }}
                  >
                    {tab.icon}
                  </Box>
                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: activeTab === index ? 600 : 500,
                        color: activeTab === index ? theme.palette.primary.main : theme.palette.text.primary,
                        mb: 0.5
                      }}
                    >
                      {tab.label}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: '0.85rem', lineHeight: 1.3 }}
                    >
                      {tab.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Main Content Area */}
          <Box sx={{ flex: 1 }}>
            <Paper 
              elevation={0}
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.6)})`,
                backdropFilter: 'blur(10px)',
                minHeight: 600,
              }}
            >
              <Box sx={{ p: 0 }}>
                {settingsTabs[activeTab]?.component}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SettingsPage;