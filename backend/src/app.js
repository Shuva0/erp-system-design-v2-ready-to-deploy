const express = require('express');
const cors = require('cors');
const passport = require('passport');
require('./config/passport'); // registers the Google strategy

const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes/index');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1', routes);

// Must be the LAST middleware registered — Express calls error handlers
// based on registration order when next(err) is invoked.
app.use(errorHandler);

module.exports = app;
