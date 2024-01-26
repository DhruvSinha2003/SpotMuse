// app.js
const express = require('express');
const axios = require('axios');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const session = require('express-session');
require('dotenv').config();

const app = express();

// Configure Express to use EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Set up middleware
app.use(express.static('public'));
app.use(session({ secret: 'mrmrontheradio', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/auth/spotify');
    }
  }
  

// Spotify API credentials
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const spotifyCallbackUrl = 'http://localhost:3000/auth/callback'; // Change the port as needed

// Configure Passport for Spotify authentication
passport.use(new SpotifyStrategy({
    clientID: spotifyClientId,
    clientSecret: spotifyClientSecret,
    callbackURL: spotifyCallbackUrl,
  },
    (accessToken, refreshToken, expires_in, profile, done) => {
      // Create a user object with necessary information
      const user = {
        id: profile.id,
        displayName: profile.displayName,
        accessToken: accessToken,
      };
  
      // Store user information in session
      return done(null, user);
    }
  ));
  

// Serialize user information into session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Home route
app.get('/', (req, res) => {
    res.render('index', { user: req.user || {} });
  });
  
// Top Tracks route
app.get('/top-tracks', ensureAuthenticated, async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
  
      // Use Axios to fetch top tracks from the Spotify API
      const topTracks = await fetchTopTracks(req.user.accessToken); // Implement this function
      res.render('top-tracks', { topTracks, user: req.user });
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
// Playlist Generator route
app.get('/playlist-generator', ensureAuthenticated, async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      console.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    // Use Axios to fetch user's top tracks from the Spotify API
    const userTopTracks = await fetchTopTracks(req.user.accessToken);

    // Use Axios to fetch global top tracks from the Spotify API
    const globalTopTracks = await fetchGlobalTopTracks(req.user.accessToken); // Pass the user's access token

    res.render('playlist-generator', { userTopTracks, globalTopTracks, user: req.user });
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    res.status(500).send('Internal Server Error');
  }
});

  

  app.get('/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-read-email', 'user-read-private', 'user-top-read'],
    showDialog: true,
  }),
);

app.get('/auth/callback',
  passport.authenticate('spotify', { failureRedirect: '/' }),
  (req, res) => {
    console.log('Callback executed successfully');
    console.log('User authenticated:', req.isAuthenticated());
    console.log('User profile:', req.user);

    res.redirect('/');
  },
);


// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// Function to fetch global top tracks from Spotify API
// Function to fetch global top tracks from Spotify API
async function fetchGlobalTopTracks(accessToken) {
  const apiUrl = "https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF"  ; // This endpoint represents the global top tracks
  const response = await axios.get(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data.items;
}




// Function to fetch top tracks from Spotify API
async function fetchTopTracks(accessToken) {
  const apiUrl = 'https://api.spotify.com/v1/me/top/tracks';
  const response = await axios.get(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data.items;
}