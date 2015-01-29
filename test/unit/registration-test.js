/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */
'use strict';

var config = require('./testConfig'),
    lwm2mClient = require('iotagent-lwm2m-lib').client,
    request = require('request'),
    iotAgent = require('../../lib/iotAgentLwm2m'),
    ngsiTestUtils = require('./../../lib/ngsiUtils'),
    mongoUtils = require('./mongoDBUtils'),
    async = require('async'),
    utils = require('../utils'),
    should = require('should'),
    clientConfig = {
        host: 'localhost',
        port: '60001',
        endpointName: 'TestClient',
        url: '/light'
    },
    ngsiClient = ngsiTestUtils.create(
        config.ngsi.contextBroker.host,
        config.ngsi.contextBroker.port,
        'smartGondor',
        '/gardens'
    );


describe('Device auto-registration test', function() {
    beforeEach(function(done) {
        async.series([
            async.apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
            async.apply(iotAgent.start, config)
        ], done);
    });
    afterEach(function(done) {
        async.series([
            iotAgent.stop,
            async.apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host)
        ], done);
    });
    describe('When a device sends a registration request to the LWM2M endpoint of the IoT Agent', function(done) {
        it('should return the registration information', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    should.exist(result.serverInfo);
                    should.exist(result.location);

                    done();
                }
            );
        });
        it('should register its passive attributes in the Context Broker as a Context Provider', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    ngsiClient.discover('TestClient:Light', 'Light', undefined, function(error, response, body) {
                        should.not.exist(error);
                        should.exist(body);
                        should.not.exist(body.errorCode);
                        done();
                    });
                }
            );
        });
    });

    describe('When a device sends a unregistration request to the LWM2M endpoint of the IoT Agent', function() {
        var deviceInformation;

        beforeEach(function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    deviceInformation = result;
                    done();
                }
            );
        });

        it('should not return any error', function(done) {
            lwm2mClient.unregister(deviceInformation, function(error) {
                should.not.exist(error);
                done();
            });
        });
        it('should unregister the context provider', function(done) {
            lwm2mClient.unregister(deviceInformation, function(error) {
                setTimeout(function() {
                    ngsiClient.discover('TestClient:Light', 'Light', undefined, function(error, response, body) {
                        should.not.exist(error);
                        should.exist(body);
                        should.exist(body.errorCode);
                        body.errorCode.code.should.equal('404');
                        done();
                    });
                }, 1500);
            });
        });
    });

    describe('When a device sends a registration request for an unknown type', function(done) {
        it('should return the registration information', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                '/longitude',
                clientConfig.endpointName,
                function(error, result) {
                    should.exist(error);

                    done();
                }
            );
        });
    });

    describe('When a preprovisioned device sends a registration request to the the IoT Agent', function(done) {
        var options = {
            url: 'http://localhost:' + config.ngsi.server.port + '/iot/devices',
            method: 'POST',
            json: utils.readExampleFile('./test/provisionExamples/preprovisionDevice.json')
        };

        beforeEach(function(done) {
            request(options, function(error, response, body) {
                done();
            });
        });
        it('should return the registration information', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                '/rd',
                'Light1',
                function(error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    should.exist(result.serverInfo);
                    should.exist(result.location);

                    done();
                }
            );
        });
        it('should register its passive attributes in the Context Broker as a Context Provider', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    ngsiClient.discover('TheFirstLight', 'TheLightType', undefined, function(error, response, body) {
                        should.not.exist(error);
                        should.exist(body);
                        should.not.exist(body.errorCode);
                        done();
                    });
                }
            );
        });
    });
});
