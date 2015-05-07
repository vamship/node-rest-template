/* jshint node:true, expr:true */
'use strict';
var _config = require('../../config');
var _supertest = require('supertest');
var _path = require('path');
var expect = require('chai').expect;

describe('[public routes]', function() {
    var MOUNT_PATH = '/public/';
    var request = _supertest(_config.baseUrl);

    function _getPath(path) {
        return _path.join(MOUNT_PATH, path);
    }

    describe('GET /__status', function() {
        it('should show the application status when invoked', function(done) {
            request.get(_getPath('/__status'))
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err, res) {
                    expect(err).to.be.null;

                    var payload = res.body;
                    expect(payload).to.be.defined;
                    expect(payload.app).to.equal('node-rest-template');
                    expect(payload.version).to.be.a('string');
                    expect(payload.timestamp).to.be.a('number');
                    done();
                });
        });
    });
});
