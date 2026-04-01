const express = require('express');
const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const router = express.Router();
const User = require('./models/User');

const tokens = new Map();
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth values are missing in .env. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
}

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'missing-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) {
        return done(new Error('Google profile missing email'), null);
      }

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName || 'Google User',
          email,
          password: hashPassword(crypto.randomUUID()),
          role: 'user',
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  console.warn('GitHub OAuth values are missing in .env. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.');
}

passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID || 'missing-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'missing-client-secret',
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user:email'],
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) {
        return done(new Error('GitHub profile missing email'), null);
      }

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: profile.displayName || profile.username || 'GitHub User',
          email,
          password: hashPassword(crypto.randomUUID()),
          role: 'user',
        });
      }
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Test route
router.get('/', (req, res) => {
  res.send('Auth route working');
});

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = hashPassword(password);
    const user = new User({ name, email: email.toLowerCase(), password: hashedPassword, role: 'user' });
    await user.save();

    return res.status(201).json({ message: 'Signup successful', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Signup DB error:', err);
    return res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    tokens.set(token, { userId: user._id.toString(), expiresAt });

    return res.status(200).json({ token, expiresAt, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login DB error:', err);
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

router.get('/me', async (req, res) => {
  const authorization = req.header('Authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorization.replace('Bearer ', '');
  const tokenData = tokens.get(token);
  if (!tokenData) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (Date.now() > tokenData.expiresAt) {
    tokens.delete(token);
    return res.status(401).json({ message: 'Token expired' });
  }

  try {
    const user = await User.findById(tokenData.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    console.error('Me endpoint DB error:', err);
    return res.status(500).json({ message: 'Unable to fetch user', error: err.message });
  }
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id') {
    return res.status(400).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=google_auth_failed` }),
  async (req, res) => {
    const user = req.user;
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    tokens.set(token, { userId: user._id.toString(), expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userParam = encodeURIComponent(JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }));
    const redirectUrl = `${frontendUrl}/?token=${token}&expiresAt=${expiresAt}&user=${userParam}`;
    return res.redirect(redirectUrl);
  }
);

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID === 'your_github_client_id') {
    return res.status(400).json({ error: 'GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env' });
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?error=github_auth_failed` }),
  async (req, res) => {
    const user = req.user;
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    tokens.set(token, { userId: user._id.toString(), expiresAt });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const userParam = encodeURIComponent(JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }));
    const redirectUrl = `${frontendUrl}/?token=${token}&expiresAt=${expiresAt}&user=${userParam}`;
    return res.redirect(redirectUrl);
  }
);

module.exports = router;
