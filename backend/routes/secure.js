const express = require('express');
const router = express.Router();
const c = require('../controllers');
const m = require('../models');
const middleware = require('../middleware');
const { authenticateJWT, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



// CORS middleware - similar to forecastRoutes.js
router.use((req, res, next) => {
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Debug route to check auth is working
router.get('/auth-test', authenticateJWT, (req, res) => {
  res.json({
    message: 'Auth is working!',
    user: req.user
  });
});

// User profile routes
router.get('/users/me', authenticateJWT, c.user.getCurrentUser);

// Profile routes
router.route('/users/profile')
  .get(authenticateJWT, c.user.getProfile)  // Get current user's profile
  .patch(authenticateJWT, upload.single('image'), c.user.updateProfile);  // Update profile with optional image

// Change password route
router.patch('/users/profile/password', authenticateJWT, c.user.changePassword);

// Existing routes
router.get('/role', authenticateJWT, c.role.index);
router.get('/activitylog', authenticateJWT, middleware.requireAdminOrUser, c.activitylog.index);
router.get('/users', authenticateJWT, middleware.requireAdmin, c.user.index);
router.post('/user/:UserId', authenticateJWT, c.userUpdate.update);

// Add this new route for checking admin status
router.get('/auth/check-admin', authenticateJWT, (req, res) => {
  try {
    // The user is already authenticated at this point due to the auth middleware
    // Just return the admin status from the user object
    res.json({
      success: true,
      isAdmin: req.user.role === 'admin' || req.user.role === 'superadmin'
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check admin status'
    });
  }
});

// Let's say the route below is very sensitive and we want only authorized users to have access
// router.get('/nationalgps', c.nationalgps.index);
// router.post('/nationalgps', c.nationalgps.saveorupdate);
// router.get('/nationalneb', c.nationalneb.index);
// router.post('/nationalneb', c.nationalneb.saveorupdate);

// router.get('/solution-preset-names', m.requireAdmin, c.solutionpreset.presets);
// router.get('/solution-presets/:preset_name?', m.requireAdmin, c.solutionpreset.index);
// router.post('/solution-preset/:id', m.requireAdmin, c.solutionpreset.update);
// router.delete('/solution-preset/:id', m.requireAdmin, c.solutionpreset.destroy);
// router.post('/solution-preset', m.requireAdmin, c.solutionpreset.create);



module.exports = router;
