/* jshint node:true */
'use strict';

var _fs = require('fs');
var _promise = require('wysknd-lib').promise;
var _utils = require('wysknd-lib').utils;
var _folder = require('wysknd-lib').folder;

// -------------------------------------------------------------------------------
//  Help documentation
// -------------------------------------------------------------------------------
var HELP_TEXT =
'--------------------------------------------------------------------------------\n' +
' Defines tasks that are commonly used during the development process. This      \n' +
' includes tasks for linting, building and testing.                              \n' +
'                                                                                \n' +
' Supported Tasks:                                                               \n' +
'   [default]         : Performs standard pre-commit/push activities. Runs       \n' +
'                       jsbeautifier on all source files (html and css files are \n' +
'                       also beautified), then runs jshint, and then executes all\n' +
'                       tests against the source files. Consider executing       \n' +
'                       the test:all:dev task as well to ensure that the         \n' +
'                       development workflow is not broken.                      \n' +
'                                                                                \n' +
'   env               : Provides information regarding the current environment.  \n' +
'                       This an information only task that does not alter any    \n' +
'                       file/folder in the environment.                          \n' +
'                                                                                \n' +
'   help              : Shows this help message.                                 \n' +
'                                                                                \n' +
'   clean             : Cleans out all build artifacts and other temporary files \n' +
'                       or directories.                                          \n' +
'                                                                                \n' +
'   monitor:[opt1]:   : Monitors files for changes, and triggers actions based   \n' +
'           [opt2]:     on specified options. Supported options are as follows:  \n' +
'           [opt3]        [lint]   : Executes jshint with default options against\n' +
'                                    all source files.                           \n' +
'                         [server] : Executes server side unit tests against all \n' +
'                                    source files. This task will automatically  \n' +
'                                    launch the web server prior to running the  \n' +
'                                    tests, and shutdown the server after the    \n' +
'                                    tests have been executed.                   \n' +
'                         [build]  : Performs a full build/test cycle. This      \n' +
'                                    includes linting, building and testing of   \n' +
'                                    all build artifacts. If this task is        \n' +
'                                    specified, all others will be ignored.      \n' +
'                                                                                \n' +
'                       Multiple options may be specified, and the triggers will \n' +
'                       be executed in the order specified. If a specific task   \n' +
'                       requires a web server to be launched, this will be done  \n' +
'                       automatically.                                           \n' +
'                                                                                \n' +
'   jshint:dev        : Executes jshint against all source files.                \n' +
'                                                                                \n' +
'   build             : Builds all of the source files and deploys the results   \n' +
'                       to the build folder.                                     \n' +
'                                                                                \n' +
'   test:[server]:    : Executes tests against source files or build artifacts.  \n' +
'        [dev|build]    The type of test to execute is specified by the first    \n' +
'                       sub target (server), and the files to test (dev/build)   \n' +
'                       is specified by the second subtarget. The first          \n' +
'                       subtarget is mandatory.                                  \n' +
'                       If the "build" subtarget is specified, sources must      \n' +
'                       already be built and ready for testing in the build      \n' +
'                       directory.                                               \n' +
'                       If required by the tests, an instance of restify will be \n' +
'                       started prior to executing the tests.                    \n' +
'                                                                                \n' +
'   bump:[major|minor]: Updates the version number of the package. By default,   \n' +
'                       this task only increments the patch version number. Major\n' +
'                       and minor version numbers can be incremented by          \n' +
'                       specifying the "major" or "minor" subtask.               \n' +
'                                                                                \n' +
'   package           : Prepares the application for deployment by creating a    \n' +
'                       distribution package.                                    \n' +
'                                                                                \n' +
' IMPORTANT: Please note that while the grunt file exposes tasks in addition to  \n' +
' ---------  the ones listed below (no private tasks in grunt yet :( ), it is    \n' +
'            strongly recommended that just the tasks listed below be used       \n' +
'            during the dev/build process.                                       \n' +
'                                                                                \n' +
'--------------------------------------------------------------------------------';
module.exports = function(grunt) {
    /* ------------------------------------------------------------------------
     * Initialization of dependencies.
     * ---------------------------------------------------------------------- */
    //Time the grunt process, so that we can understand time consumed per task.
    require('time-grunt')(grunt);

    //Load all grunt tasks by reading package.json.
    require('load-grunt-tasks')(grunt);

    /* ------------------------------------------------------------------------
     * Build configuration parameters
     * ---------------------------------------------------------------------- */
    var packageConfig = grunt.file.readJSON('package.json') || {};

    var ENV = {
        appName: packageConfig.name || '__UNKNOWN__',
        appVersion: packageConfig.version || '__UNKNOWN__',
        tree: {                             /* ------------------------------ */
                                            /* <ROOT>                         */
            'server': {                     /*  |--- server                   */
                'routes': null              /*  |   |--- routes               */
            },                              /*  |                             */
            'test': {                       /*  |--- test                     */
                'server': null              /*  |   |--- server               */
            },                              /*  |                             */
            'logs': null,                   /*  |--- logs                     */
            'working': {                    /*  |--- working                  */
                'server': {                 /*  |   |--- server               */
                    'routes': null          /*  |   |   |--- routes           */
                }                           /*  |   |                         */
            },                              /*  |   |                         */
            'dist': null                    /*  |   |--- dist                 */
        }                                   /* ------------------------------ */
    };

    ENV.ROOT = _folder.createFolderTree('./', ENV.tree);
    ENV.bannerText = '/*! [' + ENV.appName + ' v' + ENV.appVersion +
                   '] Built: <%= grunt.template.today("yyyy-mm-dd HH:MM a") %> */\n';
    ENV.publishArchive = ENV.appName + '_' + ENV.appVersion + '.zip';

    // This is the root url prefix for the app, and represents the path
    // (relative to root), where the app will be available.
    // This value should remain unchanged if the app does not sit behind a
    // proxy. If a proxy is present (that routes to the app based on URL
    // values), this value should be tweaked to include the proxy path.
    ENV.proxyPrefix = ''; //+ ENV.appName;

    (function _createTreeRefs(parent, subTree) {
        for(var folder in subTree) {
            var folderName = folder.replace('.', '_');
            parent[folderName] = parent.getSubFolder(folder);

            var children = subTree[folder];
            if(typeof children === 'object') {
                _createTreeRefs(parent[folder], children);
            }
        }
    })(ENV.ROOT, ENV.tree);

    // Shorthand references to key folders.
    var SERVER = ENV.ROOT.server;
    var TEST = ENV.ROOT.test;
    var LOGS = ENV.ROOT.logs;
    var DIST = ENV.ROOT.dist;
    var WORKING = ENV.ROOT.working;
    var SERVER_BUILD = WORKING.server;

    /* ------------------------------------------------------------------------
     * Grunt task configuration
     * ---------------------------------------------------------------------- */
    grunt.initConfig({
        /**
         * Configuration for grunt-contrib-clean, which is used to:
         *  - Remove temporary files and folders.
         */
        clean: {
            dist: [ DIST.getPath() ],
            working: [ WORKING.getPath() ],
            logs: [ LOGS.getChildPath('*') ]
        },

        /**
         * Configuration for grunt-contrib-copy, which is used to:
         *  - Copy files to a distribution folder during build.
         */
        copy: {
            compile: {
                files: [ {
                    expand: true,
                    cwd: SERVER.getPath(),
                    src: ['**'],
                    dest: SERVER_BUILD.getPath()
                }, {
                    expand: true,
                    cwd: ENV.ROOT.getPath(),
                    src: [ LOGS.getPath() ],
                    dest: WORKING.getPath()
                }, {
                    expand: true,
                    cwd: ENV.ROOT.getPath(),
                    src: ['.ebextensions/**'],
                    dest: WORKING.getPath()
                }, {
                    expand: false,
                    cwd: ENV.ROOT.getPath(),
                    src: ['package.json'],
                    dest: WORKING.getPath()
                } ]
            }
        },

        /**
         * Configuration for grunt-contrib-compress, which is used to:
         *  - Create compressed archives of build artifacts.
         */
        compress: {
            options: {},
            default: {
                options: {
                    mode: 'zip',
                    archive: DIST.getChildPath(ENV.publishArchive)
                },
                files: [ {
                    cwd: WORKING.getPath(),
                    // .ebextensions is for elastic beanstalk. If the directory
                    // does not exists, this will have no impact.
                    src: [ '**/*', '.ebextensions/*' ],
                    expand: true
                } ]
            }
        },

        /**
         * Configuration for grunt-mocha-test, which is used to:
         *  - Execute server side node.js tests
         *  - Test web server API by making http requests to the server
         */
        mochaTest: {
            options: {
                reporter: 'spec',
                timeout: 8000,
                colors: true
            },
            default: [ TEST.server.allFilesPattern('js') ]
        },

        /**
         * Configuration for grunt-jsbeautifier, which is used to:
         *  - Beautify all javascript, html and css files  prior to commit/push.
         */
        jsbeautifier: {
            dev: [ SERVER.allFilesPattern('js'),
                    TEST.allFilesPattern('js') ]
        },

        /**
         * Configuration for grunt-contrib-watch, which is used to:
         *  - Monitor all source/test files and trigger actions when these
         *    files change.
         */
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                jshintrc: true
            },
            dev: [ 'Gruntfile.js',
                    SERVER.allFilesPattern('js'),
                    TEST.allFilesPattern('js') ]
        },

        /**
         * Configuration for grunt-contrib-watch, which is used to:
         *  - Monitor all source/test files and trigger actions when these
         *    files change.
         */
        watch: {
            allSources: {
                files: [ SERVER.allFilesPattern(), TEST.allFilesPattern() ],
                tasks: [ ]
            }
        },

        /**
         * Configuration for grunt-express-server, which is used to:
         *  - Start an instance of the express server for the purposes of
         *    running tests.
         */
        express: {
            options: {
                debug: true
            },
            dev: {
                options: {
                    node_env: 'dev',
                    script: SERVER.getChildPath('server.js')
                }
            },
            build: {
                options: {
                    node_env: 'test',
                    script: SERVER_BUILD.getChildPath('server.js')
                }
            }
        },

        /**
         * Configuration for grunt-bump, which is used to:
         *  - Update the version number on package.json
         */
        bump: {
            options: {
                push: false
             }
        }
    });

    /* ------------------------------------------------------------------------
     * Task registrations
     * ---------------------------------------------------------------------- */

    /**
     * Default task. Performs default tasks prior to commit/push, including:
     *  - Beautifying files
     *  - Linting files
     *  - Building sources
     *  - Testing build artifacts
     *  - Cleaning up build results
     */
    grunt.registerTask('default', ['jsbeautifier:dev',
                                    'jshint:dev',
                                    'build',
                                    'test:server:build',
                                    'clean' ]);

    /**
     * Create distribution package task. Creates a new distribution of the app,
     * ready for deployment.
     */
    grunt.registerTask('package', ['jsbeautifier:dev',
                                 'jshint:dev',
                                 'build',
                                 'test:server:build',
                                 'compress:default' ]);

    /**
     * Test task - executes tests against dev or build artifacts.
     */
    grunt.registerTask('test',
        'Executes tests against sources or build artifacts',
        function(testType, target) {
            var testAction;
            var startServer = false;

            target = target || 'dev';

            if(testType === 'server') {
                testAction = 'mochaTest:default';
                startServer = true;
            }

            if(testAction) {
                if(startServer) {
                    grunt.task.run('express:' + target);
                }
                grunt.task.run(testAction);
            } else {
                grunt.log.warn('Unrecognized test type or target. Please see help (grunt help) for task usage information');
            }
        }
    );


    // Monitor task - track changes on different sources, and enable auto
    // execution of tests if requested.
    //  - If no arguments are specified, just launch web server with auto
    //    refresh capabilities.
    //  - If arguments are specified (see help) execute the necessary actions
    //    on changes.
    grunt.registerTask('monitor',
        'Monitors source files for changes, and performs actions as necessary',
        function() {
            var tasks = [];

            var serverMode = grunt.option('serverMode') || 'dev';
            // Process the arguments (specified as subtasks).
            for (var index = 0; index < arguments.length; index++) {
                var arg = arguments[index];
                var task = null;

                if (arg === 'lint') {
                    tasks.push('jshint:dev');

                } else if ('server' === arg) {
                    tasks.push('test:server:' + serverMode);

                } else if ('build' === arg) {
                    tasks.slice(0, 0);
                    tasks.push('jshint:dev');
                    tasks.push('build');
                    tasks.push('test:server:build');
                    break;

                } else {
                    // Unrecognized argument.
                    console.warn('Unrecognized argument: %s', arg);
                }
            }

            if(tasks.length > 0) {
                grunt.config.set('watch.allSources.tasks', tasks);
                grunt.log.writeln('Tasks to run on change: [' + tasks + ']');
                grunt.task.run('watch:allSources');
            } else {
                grunt.log.writeln('No tasks specified to execute on change');
            }
        }
    );

    /**
     * Build task - copies all artifacts to the build folder
     */
    grunt.registerTask('build',
        'Performs a full build of all source files, preparing it for packaging/publication',
        function(target) {
            grunt.task.run('clean:dist');
            grunt.task.run('clean:working');
            grunt.task.run('copy:compile');
        }
    );

    /**
     * Shows the environment setup.
     */
    grunt.registerTask('env',
        'Shows the current environment setup',
        function() {
            var separator = new Array(80).join('-');
            function _showRecursive(root, indent) {
                var indentChars = '  ';
                if(!indent) {
                    indent = 0;
                } else  {
                    indentChars += '|';
                }
                indentChars += new Array(indent).join(' ');
                indentChars += '|--- ';
                var hasChildren = false;
                for(var prop in root) {
                    var member = root[prop];
                    if(typeof member === 'object') {
                        var maxLen = 74 - (indentChars.length + prop.length);
                        var status = _utils.padLeft(member.getStatus(), maxLen);

                        grunt.log.writeln(indentChars + prop + status);
                        hasChildren = true;
                        if(_showRecursive(member, indent  + 4)) {
                            grunt.log.writeln('  |');
                        }
                    }
                }

                return hasChildren;
            }

            grunt.log.writeln('\n' + separator);
            _showRecursive(ENV.ROOT, 0);
            grunt.log.writeln(separator + '\n');
        }
    );

    /**
     * Shows help information on how to use the Grunt tasks.
     */
    grunt.registerTask('help',
        'Displays grunt help documentation',
        function(){
            grunt.log.writeln(HELP_TEXT);
        }
    );
};
