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
 * Author: Daniel Calvo - ATOS Research & Innovation
 */
'use strict';

var config = require('./testConfig'),
    lwm2mClient = require('lwm2m-node-lib').client,
    request = require('request'),
    iotAgent = require('../../lib/iotAgentLwm2m'),
    ngsiTestUtils = require('./../../lib/ngsiUtils'),
    mongoUtils = require('./mongoDBUtils'),
    async = require('async'),
    apply = async.apply,
    utils = require('../utils'),
    updateRegistration = require('../../lib/services/lwm2mHandlers/updateRegistration'),
    should = require('should'),
    clientConfig = {
        host: 'localhost',
        port: '60001',
        endpointName: 'TestClient',
        url: '/light',
        ipProtocol: 'udp4',
    },
    ngsiClient = ngsiTestUtils.create(
        config.ngsi.contextBroker.host,
        config.ngsi.contextBroker.port,
        'smartGondor',
        '/gardens'
    ),
    deviceInformation;

describe('Device update registration test', function() {
    beforeEach(function(done) {
        lwm2mClient.init(config);
        async.series(
            [
                apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
                apply(iotAgent.start, config),
                apply(lwm2mClient.registry.create, '/5000/0'),
            ],
            done
        );
    });
    afterEach(function(done) {
        var actions = [iotAgent.stop, apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host)];

        if (deviceInformation) {
            actions.splice(0, 0, apply(lwm2mClient.unregister, deviceInformation));
        }

        async.series(actions, done);
    });
    describe('When a registry update request is received and the device does not exist', function(done) {
        beforeEach(function(done) {
            async.series(
                [
                    apply(lwm2mClient.registry.create, '/3303/0'),
                    async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '19'),
                ],
                done
            );
        });

        it('should return the appropiate error', function(done) {
            var deviceInfo = {
                _id: '5a5dfe44f3dffc5e233d27d3',
                id: 79,
                type: 'Device',
                name: 'ws1',
                lifetime: '85671',
                path: '/rd/rd',
                port: 35239,
                address: '127.0.0.1',
                creationDate: '2018-01-16T13:29:40.972Z',
            };

            updateRegistration.handler(deviceInfo, null, function(error) {
                should.exist(error);
                error.name.should.equal('DEVICE_NOT_FOUND');
                done();
            });
        });
    });

    describe(
        'When a preprovisioned device registers to the the IoT Agent with an active attribute ' +
            'without internal mapping, but present in the OMA registry',
        function(done) {
            var options = {
                url: 'http://localhost:' + config.ngsi.server.port + '/iot/devices',
                method: 'POST',
                json: utils.readExampleFile('./test/provisionExamples/preprovisionDeviceOMANoInternalMapping.json'),
                headers: {
                    'fiware-service': 'smartgondor',
                    'fiware-servicepath': '/gardens',
                },
            };

            beforeEach(function(done) {
                request(options, function(error, response, body) {
                    async.series(
                        [
                            apply(lwm2mClient.registry.create, '/3303/0'),
                            async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '19'),
                        ],
                        done
                    );
                });
            });

            it('should handle device update queries and restart observations', function(done) {
                lwm2mClient.register(clientConfig.host, clientConfig.port, '/rd', 'ws1', function(error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    should.exist(result.serverInfo);
                    should.exist(result.location);
                    lwm2mClient.update(result, function(error, result) {
                        should.not.exist(error);
                        should.exist(result);
                        should.exist(result.serverInfo);
                        should.exist(result.location);
                        setTimeout(function() {
                            async.series(
                                [
                                    async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '44'),
                                    async.nextTick,
                                    async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '22'),
                                    async.nextTick,
                                    async.apply(lwm2mClient.registry.setResource, '/3303/0', '0', '00'),
                                    async.nextTick,
                                ],
                                function(error) {
                                    setTimeout(function() {
                                        ngsiClient.query('weather1', 'weatherStation', ['Temperature Sensor'], function(
                                            error,
                                            response,
                                            body
                                        ) {
                                            should.not.exist(error);
                                            should.exist(body);
                                            should.not.exist(body.errorCode);
                                            body.contextResponses[0].contextElement.attributes[0].value.should.equal(
                                                '00'
                                            );
                                            done();
                                        });
                                    }, 500);
                                }
                            );
                        }, 1000);
                    });
                });
            });
        }
    );
});
