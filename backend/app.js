const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const { environment } = require('./config');
const isProduction = environment === 'production';

const { ValidationError } = require('sequelize');

const routes = require('./routes');

const app = express();

app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    next();
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    console.log('Before Multer - req.body:', req.body);
    console.log('Before Multer - req.file:', req.file);
    next();
});

app.use(upload.single('image'));

app.use((req, res, next) => {
    console.log('After Multer - req.body:', req.body);
    console.log('After Multer - req.file:', req.file);
    next();
});

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());


if (!isProduction) {
    // enable cors only in development
    app.use(cors());
}

// helmet helps set a variety of headers to better secure your app
app.use(
    helmet.crossOriginResourcePolicy({
        policy: "cross-origin"
    })
);

// Set the _csrf token and create req.csrfToken method
app.use(
    csurf({
        cookie: {
            secure: isProduction,
            sameSite: isProduction && "Lax",
            httpOnly: true
        }
    })
);

app.use(routes);

app.use((_req, _res, next) => {
    const err = new Error("The requested resource couldn't be found.");
    err.title = "Resource Not Found";
    err.errors = { message: "The requested resource couldn't be found." };
    err.status = 404;
    next(err);
});

app.use((err, _req, _res, next) => {
    // check if error is a Sequelize error:
    if (err instanceof ValidationError) {
        let errors = {};
        for (let error of err.errors) {
            errors[error.path] = error.message;
        }
        err.title = 'Validation error';
        err.errors = errors;
    }
    next(err);
});

app.use((err, _req, res, _next) => {
    res.status(err.status || 500);
    console.error(err);
    res.json({
        title: err.title || 'Server Error',
        message: err.message,
        errors: err.errors,
        stack: isProduction ? null : err.stack
    });
});

module.exports = app;
