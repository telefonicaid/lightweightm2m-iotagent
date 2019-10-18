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
 *
 * Modified by: Daniel Calvo - ATOS Research & Innovation
 */
'use strict';

var config = require('./testConfig'),
    lwm2mClient = require('lwm2m-node-lib').client,
    iotAgent = require('../../../lib/iotAgentLwm2m'),
    ngsiTestUtils = require('./../../../lib/ngsiUtils'),
    mongoUtils = require('../mongoDBUtils'),
    async = require('async'),
    apply = async.apply,
    should = require('should'),
    clientConfig = {
        host: 'localhost',
        port: '60001',
        endpointName: 'TestClient',
        url: '/light',
        ipProtocol: 'udp4'
    },
    ngsiClient = ngsiTestUtils.createNgsi2(
        config.ngsi.contextBroker.host,
        config.ngsi.contextBroker.port,
        'smartgondor',
        '/gardens'
    ),
    deviceInformation;

describe('Passive attributes test', function() {
    beforeEach(function(done) {
        lwm2mClient.init(config);
        async.series(
            [
                async.apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
                async.apply(iotAgent.start, config),
                lwm2mClient.registry.reset
            ],
            done
        );
    });

    afterEach(function(done) {
        async.series(
            [
                apply(lwm2mClient.unregister, deviceInformation),
                iotAgent.stop,
                apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
                lwm2mClient.registry.reset
            ],
            done
        );
    });

    describe('When a passive attribute of the entity corresponding to a device is queried in Orion', function() {
        beforeEach(function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    deviceInformation = result;
                    async.series(
                        [
                            async.apply(lwm2mClient.registry.create, '/6000/0'),
                            async.apply(lwm2mClient.registry.setResource, '/6000/0', '3', '12')
                        ],
                        done
                    );
                }
            );
        });

        it('should query the value in the LWM2M device via the IoT Agent', function(done) {
            var handleExecuted = false;

            function handleRead(objectType, objectId, resourceId, value, callback) {
                objectType.should.equal('6000');
                objectId.should.equal('0');
                resourceId.should.equal('3');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read', handleRead);

            ngsiClient.query('TestClient:Light', 'Light', ['luminescence'], function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);
                should.exist(body);
                body.should.be.instanceof(Array).and.have.lengthOf(1);
                body[0].id.should.equal('TestClient:Light');
                body[0].type.should.equal('Light');
                should.exist(body[0].luminescence);
                body[0].luminescence.type.should.equal('Lumens');
                body[0].luminescence.value.should.equal('12');
                done();
            });
        });
    });

    describe('When a passive attribute of the entity corresponding to a device is modified in Orion', function() {
        var attributes = [
            {
                name: 'luminescence',
                type: 'Lumens',
                value: '8375'
            }
        ];

        beforeEach(function(done) {
            lwm2mClient.register(
                clientConfig.host,
                clientConfig.port,
                clientConfig.url,
                clientConfig.endpointName,
                function(error, result) {
                    deviceInformation = result;
                    async.series(
                        [
                            async.apply(lwm2mClient.registry.create, '/6000/0'),
                            async.apply(lwm2mClient.registry.setResource, '/6000/0', '3', '12')
                        ],
                        done
                    );
                }
            );
        });

        it('should write the value in the LWM2M device via the IoT Agent', function(done) {
            var handleExecuted = false;

            function handleWrite(objectType, objectId, resourceId, value, callback) {
                objectType.should.equal('6000');
                objectId.should.equal('0');
                resourceId.should.equal('3');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'write', handleWrite);

            ngsiClient.update('TestClient:Light', 'Light', attributes, function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);

                done();
            });
        });
    });

    describe('When a passive OMA attribute request is queried in orion', function() {
        beforeEach(function(done) {
            async.series(
                [
                    async.apply(lwm2mClient.registry.create, '/0/0'),
                    async.apply(lwm2mClient.registry.setResource, '/0/0', '0', 'coap://localhost')
                ],
                function(error) {
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
                }
            );
        });

        it('should query the value in the LWM2M device via the IoT Agent using the OMA Mapping', function(done) {
            var handleExecuted = false;

            function handleRead(objectType, objectId, resourceId, value, callback) {
                objectType.should.equal('0');
                objectId.should.equal('0');
                resourceId.should.equal('0');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read', handleRead);

            ngsiClient.query('TestClient:Light', 'Light', ['LWM2M Server URI'], function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);
                should.exist(body);
                body.should.be.instanceof(Array).and.have.lengthOf(1);
                body[0].id.should.equal('TestClient:Light');
                body[0].type.should.equal('Light');
                should.exist(body[0]['LWM2M%20Server%20URI']);
                body[0]['LWM2M%20Server%20URI'].type.should.equal('String');
                body[0]['LWM2M%20Server%20URI'].value.should.equal('coap://localhost');
                done();
            });
        });
    });

    describe('When a passive OMA attribute is modified in Orion', function() {
        var attributes = [
            {
                name: 'LWM2M Server URI',
                type: 'string',
                value: 'coap://remotehost:9786'
            }
        ];

        beforeEach(function(done) {
            async.series(
                [
                    async.apply(lwm2mClient.registry.create, '/0/0'),
                    async.apply(lwm2mClient.registry.setResource, '/0/0', '0', 'coap://localhost')
                ],
                function(error) {
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
                }
            );
        });

        it('should write the value in the LWM2M device via the IoT Agent', function(done) {
            var handleExecuted = false;

            function handleWrite(objectType, objectId, resourceId, value, callback) {
                objectType.should.equal('0');
                objectId.should.equal('0');
                resourceId.should.equal('0');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'write', handleWrite);

            ngsiClient.update('TestClient:Light', 'Light', attributes, function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);
                done();
            });
        });
    });
});
