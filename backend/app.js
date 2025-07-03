// app.js - Updated with refresh token endpoint and proper configuration
require('dotenv').config();
const express = require('express');
const { graphqlHTTP } = require('express-graphql'); // comment this if dont need graphql
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });
const custommiddleware = require('./middleware');
const schema = require('./gql/schema'); // comment this if dont need graphql
const passportLoader = require('./passport-loader');

// routes
const openRoute_lists = require('./routes/open');
const secureRoute_list = require('./routes/secure');
const forecastRoutes = require('./routes/forecastRoutes');
const testRoutes = require('./routes/test');
const dbTestRoutes = require('./routes/dbTest');
const reportsRoutes = require('./routes/reports');
const drugsRoutes = require('./routes/drugs');
const { handleValidationErrors } = require('./middleware/validation');

const authGoogleRoutes = require('./routes/auth-google');

// Configure CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,  // This is important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 600, // Cache preflight request for 10 minutes
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
  preflightContinue: false
};

// Apply CORS with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Add request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Cookies:', req.cookies);
  console.log('Headers:', req.headers);
  
  // Add CORS headers to every response
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  // Set the allowed origin based on the request
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  next();
});

// Parse cookies before other middleware
app.use(cookieParser());

// Body parser middleware must come after CORS and cookie parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// for parsing multipart/form-data
// app.use(upload.array());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/profile-images', express.static(path.join(__dirname, 'uploads/profile-images')));

// Initialize passport
require('./passport-loader'); // This configures passport strategies
app.use(passport.initialize());

// Session is usually not needed with JWT
// app.use(passport.session());
// Add this before your routes
app.get('/api/debug/check-secret', (req, res) => {
  res.json({
    hasSecret: !!process.env.PROJECT_JWT_SECRET,
    secretLength: process.env.PROJECT_JWT_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV
  });
});
// for serializing user data
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Test routes (temporary)
app.use('/test', testRoutes);
app.use('/db-test', dbTestRoutes);

// Forecast data
app.use('/api/forecast', forecastRoutes);

// Mount public routes first
app.use('/api', openRoute_lists);
app.use('/api/drugs', drugsRoutes);  // Mount drugs routes at /api/drugs

// Mount auth routes at /auth
app.use('/auth', authGoogleRoutes);

// Mount protected routes with authentication
app.use('/api', passport.authenticate('jwt', { session: false }));
app.use('/api', secureRoute_list);
app.use('/api/reports', reportsRoutes);

// Registering API
app.use('/graphql-api', graphqlHTTP({ schema, graphiql: true })); // comment this if dont need graphql

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Error handling middleware (must be after routes but before the final error handler)
app.use(handleValidationErrors);

// Final error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});

module.exports = app;