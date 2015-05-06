/* jshint node:true */
'use strict';
var _path = require('path');
var PublicRoutesHandler = require('./public-routes-handler');

module.exports = {
    /**
     * Adds this module's routes to the restify server.
     *
     * @param {Object} app A reference to the restify server object
     * @param {Function} getPath A function that can be used to generate a path
     *                   that is relative to the mount path.
     */
    apply: function(app, getPath) {
        var routesHandler = new PublicRoutesHandler();

        /**
         * Show home page.
         */
        app.get(getPath('/'),
                routesHandler.getHomePageHandler());

        /**
         * Request for application status.
         */
        app.get(getPath('/__status'),
                routesHandler.getAppStatusHandler());

        return app;
    }
};
