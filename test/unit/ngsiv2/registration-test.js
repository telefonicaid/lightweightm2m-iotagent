/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lightweightM2M-iotagent
 *
 * lightweightM2M-iotagent is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lightweightM2M-iotagent is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lightweightM2M-iotagent.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 *
 * Modified by: Daniel Calvo - ATOS Research & Innovation
 */
'use strict';

var config = require('./testConfig'),
    lwm2mClient = require('lwm2m-node-lib').client,
    request = require('request'),
    iotAgent = require('../../../lib/iotAgentLwm2m'),
    ngsiTestUtils = require('./../../../lib/ngsiUtils'),
    mongoUtils = require('../mongoDBUtils'),
    async = require('async'),
    apply = async.apply,
    utils = require('../../utils'),
    should = require('should'),
    clientConfig = {
        host: 'localhost',
        port: '60001',
        endpointName: 'TestClient',
        url: '/light',
        ipProtocol: 'udp4'
    },
    ngsiClient = ngsiTestUtils.create(
        config.ngsi.contextBroker.host,
        config.ngsi.contextBroker.port,
        'smartGondor',
        '/gardens'
    ),
    deviceInformation;


describe('Device auto-registration test', function() {
    beforeEach(function(done) {
        lwm2mClient.init(config);
        async.series([
            apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
            apply(iotAgent.start, config)
        ], done);
    });
    afterEach(function(done) {
        var actions = [
            iotAgent.stop,
            apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host)
        ];

        if (deviceInformation) {
            actions.splice(0, 0, apply(lwm2mClient.unregister, deviceInformation));
        }

        async.series(actions, done);
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
                        body
                            .contextRegistrationResponses['0']
                            .contextRegistration
                            .attributes['0']
                            .name
                            .should.equal('luminescence');
                        done();
                    });
                }
            );
        });
    });

    describe('When a device sends a registration request with OMA objects not configured', function(done) {
        beforeEach(function(done) {
            async.series([
                apply(lwm2mClient.registry.create, '/0/2'),
                apply(lwm2mClient.registry.create, '/1/3')
            ], function(error) {
                done();
            });
        });
        afterEach(function(done) {
            done();
        });
        it('should register normally, ignoring those objects', function(done) {
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
        it('should register the resources as passive attributes in the CB with their URI', function(done) {
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
                        body
                            .contextRegistrationResponses['0']
                            .contextRegistration
                            .attributes
                            .length
                            .should.equal(21);

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

    describe('When a preprovisioned device sends a registration request with its own LWM2M Mappings', function() {
        it('should use its internal mappings instead of the type configured ones');
    });

    describe('When a device registers to a URL defined as the resource of a configuration', function() {
        var configuration = {
                url: 'http://localhost:' + config.ngsi.server.port + '/iot/services',
                method: 'POST',
                json: utils.readExampleFile('./test/provisionExamples/newConfiguration.json'),
                headers: {
                    'fiware-service': 'smartGondor',
                    'fiware-servicepath': '/gardens'
                }
            },
            removeConfiguration = {
                url: 'http://localhost:' + config.ngsi.server.port + '/iot/services',
                method: 'DELETE',
                json: {},
                headers: {
                    'fiware-service': 'smartGondor',
                    'fiware-servicepath': '/gardens'
                }
            };

        beforeEach(function(done) {
            request(configuration, function(error, result, body) {
                async.series([
                        apply(lwm2mClient.registry.create, '/3303/0'),
                        async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '89'),
                        async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '19')
                    ], done);
            });
        });

        afterEach(function(done) {
            request(removeConfiguration, done);
        });

        it('should register its passive attributes in the Context Broker as a Context Provider', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                '/lightConfig',
                'PreprovisionedLight2',
                function(error, result) {
                    ngsiClient.discover(
                        'PreprovisionedLight2:ConfiguredDevice',
                        'ConfiguredDevice',
                        ['Luminosity Sensor'],
                        function(error, response, body) {
                            should.not.exist(error);
                            should.exist(body);
                            should.not.exist(body.errorCode);
                            done();
                        });
                }
            );
        });

        it('should observe its active attributes', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                '/lightConfig',
                'PreprovisionedLight2',
                function(error, result) {
                    async.series([
                        utils.delay(100),
                        async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '2539'),
                        async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '10397'),
                        utils.delay(100)
                    ], function() {
                        ngsiClient.query(
                            'PreprovisionedLight2:ConfiguredDevice',
                            'ConfiguredDevice',
                            ['Temperature Sensor'],
                            function(error, response, body) {
                                should.not.exist(error);
                                should.exist(body);
                                should.exist(body['Temperature Sensor']);
                                done();
                            });
                    });
                }
            );
        });
    });

    describe('When a preprovisioned device registers to the the IoT Agent with an active attribute ' +
        'without internal mapping, but present in the OMA registry', function(done) {
        var options = {
            url: 'http://localhost:' + config.ngsi.server.port + '/iot/devices',
            method: 'POST',
            json: utils.readExampleFile('./test/provisionExamples/preprovisionDeviceOMANoInternalMapping.json'),
            headers: {
                'fiware-service': 'smartGondor',
                'fiware-servicepath': '/gardens'
            }
        };

        beforeEach(function(done) {
            request(options, function(error, response, body) {
                async.series([
                    apply(lwm2mClient.registry.create, '/3303/0'),
                    async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '19')
                ], done);
            });
        });
        it('should return the registration information', function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                '/rd',
                'ws1',
                function(error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    should.exist(result.serverInfo);
                    should.exist(result.location);

                    done();
                }
            );
        });
    });

    describe('When a preprovisioned device registers with an unmappable attribute', function(done) {
        it('should fail to be provisioned');
    });
});
