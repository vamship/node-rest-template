/**
 * Defines configuration settings for the server. The module returns a hash,
 * with one key for every environment that is supported. The value of each
 * key is a function that will be invoked to configure the app.
 */

/* jshint node:true */
'use strict';

var _fs = require('fs');
var _path = require('path');
var _rc = require('rc');
var _winston = require('winston');

// Global config object to store application level config.
GLOBAL.config = {};

// Global mechanism for accessing logs
GLOBAL.getLogger = function(name) {
    name = name || 'app';
    return _winston.loggers.get(name);
};

function _setConfig(key, value) {
    GLOBAL.config[key] = value;
}

var _configOverrides = {

    /**
     * Special settings that are applied when the application is run in
     * development mode.
     *
     * @param {Object} app  A reference to the restify server object.
     */
    dev: function(app) {
        var appVersion = GLOBAL.config.cfg_app_version;
        _setConfig('cfg_app_version', appVersion + '__' + (new Date()).getTime());
    },

    /**
     * Special settings that are applied when the application is run in
     * test mode.
     *
     * @param {Object} app  A reference to the restify server object.
     */
    test: function(app) {
        var appVersion = GLOBAL.config.cfg_app_version;
        _setConfig('cfg_app_version', appVersion + '__' + (new Date()).getTime());
    },

    /**
     * Special settings that are applied when the application is run in
     * production mode.
     *
     * @param {Object} app  A reference to the restify server object.
     */
    prod: function(app) {}
};

function _getPackageInfo() {
    var filePath = _path.join(__dirname, '../package.json');
    var data = _fs.readFileSync(filePath);
    var packageInfo = JSON.parse(data.toString());

    return packageInfo;
}

function _getApplicationConfig(appName) {
    // Read configuration settings from the rc file, and set defaults
    // when no settings are available in the file.
    return _rc(appName, {
        port: 3001,
        rootPath: '/',
        proxyPresent: false,
        logsDir: 'logs',
    });
}

module.exports = {

    /**
     * Applies configuration parameters to the application. Some basic
     * configuration is applied, and additionally, if applicable, some
     * environment specific settings are also applied.
     *
     * It is strongly recommended that this module be used to set all
     * application configuration values.
     *
     * @param {Object} app A reference to the restify server object.
     */
    apply: function(app) {
        // Read package info and application configuration settings.
        var packageInfo = _getPackageInfo();
        var appConfig = _getApplicationConfig(packageInfo.name);
        var env = process.env.NODE_ENV;

        // Configuration settings
        _setConfig('cfg_env', env);
        _setConfig('cfg_port', appConfig.port);
        _setConfig('cfg_app_name', packageInfo.name);
        _setConfig('cfg_app_version', packageInfo.version);

        _setConfig('cfg_logs_dir', appConfig.logsDir);
        _setConfig('cfg_proxy_present', appConfig.proxyPresent);
        _setConfig('cfg_root_path', appConfig.rootPath);

        // HACK: Just to make sure that this setting shows at this position in
        // the logs. Actual value gets overwritten later.
        _setConfig('cfg_mount_path', appConfig.rootPath);

        // Apply configuration overrides if any have been defined for the
        // environment.
        var applyConfigOverrides = _configOverrides[env];
        if (!applyConfigOverrides) {
            console.info('no config overrides found for environment [' + env + ']');
        } else {
            applyConfigOverrides(app);
        }

        var rootPath = GLOBAL.config.cfg_root_path;
        var proxyPresent = GLOBAL.config.cfg_proxy_present;
        var mountPath = proxyPresent ? '/' : rootPath;

        _setConfig('cfg_mount_path', mountPath);

        // Logger for application logs.
        _winston.loggers.add('app', {
            console: {
                level: 'silly',
                colorize: 'true',
                label: 'app'
            },
            DailyRotateFile: {
                level: 'debug',
                filename: _path.join(GLOBAL.config.cfg_logs_dir, 'app'),
                datePattern: '.yyyy-MM-dd.log'
            }
        });

        _winston.loggers.get('app').info('Logger ready!');
    }
}
