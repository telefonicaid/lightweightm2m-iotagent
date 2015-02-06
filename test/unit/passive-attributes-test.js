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
    iotAgent = require('../../lib/iotAgentLwm2m'),
    ngsiTestUtils = require('./../../lib/ngsiUtils'),
    mongoUtils = require('./mongoDBUtils'),
    async = require('async'),
    apply = async.apply,
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
    ),
    deviceInformation;

describe('Passive attributes test', function() {
    beforeEach(function(done) {
        async.series([
            async.apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
            async.apply(iotAgent.start, config)
        ], function() {
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
    });
    afterEach(function(done) {
        async.series([
            apply(lwm2mClient.unregister, deviceInformation),
            iotAgent.stop,
            apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host)
        ], done);
    });
    describe('When a passive attribute of the entity corresponding to a device is queried in Orion', function() {
        beforeEach(function(done) {
            async.series([
                async.apply(lwm2mClient.registry.create, '/6/0'),
                async.apply(lwm2mClient.registry.setResource, '/6/0', '3', '12')
            ], done);
        });

        it('should query the value in the LWM2M device via the IoT Agent', function(done) {
            var handleExecuted = false;

            function handleRead(objectType, objectId, resourceId, value, callback) {
                objectType.should.equal('6');
                objectId.should.equal('0');
                resourceId.should.equal('3');
                handleExecuted = true;
                callback();
            }

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read', handleRead);

            ngsiClient.query('TestClient:Light', 'Light', ['luminescence'], function(error, response, body) {
                should.not.exist(error);
                handleExecuted.should.equal(true);

                done();
            });
        });
    });
    describe('When a passive attribute of the entity corresponding to a device is modified in Orion', function() {
        it('should write the value in the LWM2M device via the IoT Agent');
    });
});
