const express = require('express');
//prevent most common security issues
var compression = require('compression')
const helmet = require('helmet')
const path = require('path');
const session = require('express-session')
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const rateLimit = require("express-rate-limit");
const requestIp = require('request-ip');
const mongoose = require('mongoose');
const fs = require('fs');
var jwt = require('express-jwt');

//custom imports
const config = require('./configs/config');

mongoose.connect(config.mongoDb,{ useNewUrlParser: true,useUnifiedTopology: true });
var publicKey = fs.readFileSync('./configs/public.pub');

//routes
const apiRoutes = require('./routes/api/v1/index');

var app = express();
//to prevent cross origin resource errors by setting the relavent headers
app.use(cors());
// enabling gzip
app.use(compression());

app.use(function(req, res, next) {
    //disabling cache
    res.setHeader('Surrogate-Control', 'no-store')
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next();
});

// Allows CORS, Remove are after poc testing
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:9092");

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 30, // limit each IP to 30 requests per windowMs
    statusCode: 500, //change this to 200 so the end user will get a custom msg saying server cant handle this much requests
    message: {
        "text": "limit exceeded"
    }
});

//  apply to all api requests
app.use('/api/v1', limiter);


app.use(session({
    secret: 'ASDew5rtfxcvfga',
    resave: false,
    saveUninitialized: true
}));

//Helmet helps you secure your Express apps by setting various HTTP headers.
app.use(helmet());
app.set('superSecret', config.secret); // secret variable
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); //removing public folder form routes acessing
//app.use(express.static('/uploads/'));
/*app.use('/resources',express.static(__dirname + '/images'));*/
// ip request
app.use(requestIp.mw());

// app.use(jwt({ secret: publicKey}).unless({path: ['/api/v1/testpath',
//     ]}));

app.use('/api/v1/agents', apiRoutes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        if (config.inProduction) {
            res.redirect('/500');
        } else {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    if (config.inProduction) {
        res.redirect('/500');
    } else {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    }
});


app.listen(config.port, () => {
    console.log('live on port ' + config.port);
});
module.exports = app;
