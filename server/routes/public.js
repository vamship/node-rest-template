/**
 * Defines all routes at the root level of the application.
 */

/* jshint node:true */
'use strict';
var _path = require('path');

module.exports = {
    /**
     * Adds this module's routes to the restify server.
     *
     * @param {Object} app A reference to the restify server object
     * @param {Function} getPath A function that can be used to generate a path
     *                   that is relative to the mount path.
     */
    apply: function(app, getPath) {

        /**
         * Show home page.
         */
        app.get(getPath('/'), function(req, res, next) {
            res.send(200, '/home called');
            next();
        });

        /**
         * Request for application status.
         */
        app.get(getPath('/__status'), function(req, res, next) {
            var appName = GLOBAL.config.cfg_app_name;
            var appVersion = GLOBAL.config.cfg_app_version;
            res.send(200, {
                app: appName,
                version: appVersion,
                timestamp: Date.now()
            });
            next();
        });

        return app;
    }
};
