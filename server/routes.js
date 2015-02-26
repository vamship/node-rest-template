/**
 * Defines all the routes supported by the server. For the sake of
 * managability, it is recommended that routes be defined in individual
 * modules that are in turn loaded and used by this module.
 */

/* jshint node:true */
'use strict';
var _path = require('path');

module.exports = {

    /**
     * Attaches route handlers to the web application. The handlers may be
     * defined within this module, or may be defined in other modules, and
     * just attached to specific routes within this one.
     *
     * @param {Object} app  A reference to the restify server object
     */
    apply: function(app) {
        var mountPath = GLOBAL.config.cfg_mount_path;

        function addRoutes(basePath, routes) {
            basePath = basePath || '';
            basePath = _path.join(mountPath, basePath);

            function getPath(path) {
                return _path.join(basePath, path);
            }

            if (typeof routes === 'function') {
                app.get(basePath, routes);
                app.put(basePath, routes);
                app.post(basePath, routes);
                app.del(basePath, routes);
                app.head(basePath, routes);
            } else {
                routes.apply(app, getPath);
            }
        }

        // Mount the routes at the specified base paths.
        addRoutes('/public', require('./routes/public'));
    }
};
