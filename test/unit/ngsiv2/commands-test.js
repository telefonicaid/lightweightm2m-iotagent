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

/* eslint-disable no-unused-vars */

const config = require('./testConfig');
const lwm2mClient = require('lwm2m-node-lib').client;
const request = require('request');
const iotAgent = require('../../../lib/iotAgentLwm2m');
const ngsiTestUtils = require('./../../../lib/ngsiUtils');
const mongoUtils = require('../mongoDBUtils');
const async = require('async');
const apply = async.apply;
const utils = require('../../utils');
const should = require('should');
const clientConfig = {
    host: 'localhost',
    port: '60001',
    endpointName: 'TestClient',
    url: '/robot',
    ipProtocol: 'udp4'
};
const ngsiClient = ngsiTestUtils.createNgsi(
    config.ngsi.contextBroker.host,
    config.ngsi.contextBroker.port,
    'smartgondor',
    '/gardens'
);
let deviceInformation;

describe('Command attributes test', function() {
    beforeEach(function(done) {
        lwm2mClient.init(config);

        async.series(
            [
                apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
                apply(iotAgent.start, config),
                apply(lwm2mClient.registry.create, '/5000/0')
            ],
            done
        );
    });

    describe('When a command value is changed in Orion for a statically configured type', function() {
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
                            async.apply(lwm2mClient.registry.create, '/9090/0'),
                            async.apply(lwm2mClient.registry.setResource, '/9090/0', '0', '[]')
                        ],
                        done
                    );
                }
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

        it('should send the execution command to the LWM2M client', function(done) {
            let handleExecuted = false;
            const attributes = [
                {
                    name: 'position',
                    type: 'Array',
                    value: '[15,6234,312]'
                }
            ];

            function handleExecute(objectType, objectId, resourceId, args, callback) {
                objectType.should.equal('9090');
                objectId.should.equal('0');
                resourceId.should.equal('0');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'execute', handleExecute);

            ngsiClient.update('TestClient:Robot', 'Robot', attributes, function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);
                done();
            });
        });

        it('should return a 200 OK statusCode', function(done) {
            const attributes = [
                {
                    name: 'position',
                    type: 'Array',
                    value: '[15,6234,312]'
                }
            ];

            function handleExecute(objectType, objectId, resourceId, args, callback) {
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'execute', handleExecute);

            ngsiClient.update('TestClient:Robot', 'Robot', attributes, function(error, response, body) {
                should.not.exist(error);
                response.statusCode.should.equal(204);
                done();
            });
        });
    });

    describe('When a command value is changed in Orion for a preprovisioned device', function() {
        const options = {
            url: 'http://localhost:' + config.ngsi.server.port + '/iot/devices',
            method: 'POST',
            json: utils.readExampleFile('./test/provisionExamples/provisionDeviceWithCommands.json'),
            headers: {
                'fiware-service': 'smartgondor',
                'fiware-servicepath': '/gardens'
            }
        };

        beforeEach(function(done) {
            request(options, function(error, response, body) {
                lwm2mClient.register(clientConfig.host, clientConfig.port, clientConfig.url, 'TestRobotPre', function(
                    error,
                    result
                ) {
                    deviceInformation = result;
                    async.series(
                        [
                            async.apply(lwm2mClient.registry.create, '/6789/0'),
                            async.apply(lwm2mClient.registry.setResource, '/6789/0', '17', '[]')
                        ],
                        done
                    );
                });
            });
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

        it('should send the execution command to the LWM2M client', function(done) {
            let handleExecuted = false;
            const attributes = [
                {
                    name: 'position',
                    type: 'Array',
                    value: '[15,6234,312]'
                }
            ];

            function handleExecute(objectType, objectId, resourceId, args, callback) {
                objectType.should.equal('6789');
                objectId.should.equal('0');
                resourceId.should.equal('17');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'execute', handleExecute);

            ngsiClient.update('RobotPre:TestRobotPre', 'RobotPre', attributes, function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);

                done();
            });
        });
        it('should return a 200 OK statusCode');
    });

    describe('When a command value is changed in Orion for a device registering in a configuration', function() {
        it('should send the execution command to the LWM2M client');
        it('should return a 200 OK statusCode');
    });
});
