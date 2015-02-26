/**
 * Main module that launches the web server. This file typically will not
 * require changes. Route changes have to be made in the ./routes sub package,
 * and configuration changes can be introduced using the ./config.js file.
 */

/* jshint node:true */
'use strict';

var _restify = require('restify');
var _routes = require('./routes');
var _config = require('./config');

var app = _restify.createServer();

// Application configuration.
_config.apply(app);

// Logger should be initialized by now.
var logger = GLOBAL.getLogger();

// Route configuration.
_routes.apply(app);

// Launch server.
app.listen(GLOBAL.config.cfg_port, function() {
    var SEPARATOR = (new Array(81)).join('-');

    logger.silly(SEPARATOR);
    logger.info('Restify server started.');
    var keys = Object.keys(GLOBAL.config);
    keys.forEach(function(key) {
        logger.info('%s = [%s]', key, GLOBAL.config[key]);
    });
    logger.silly(SEPARATOR);
});
