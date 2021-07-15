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

/* eslint-disable no-unused-vars */

const config = require('./testConfig');
const lwm2mClient = require('lwm2m-node-lib').client;
const iotAgent = require('../../../lib/iotAgentLwm2m');
const ngsiTestUtils = require('./../../../lib/ngsiUtils');
const mongoUtils = require('../mongoDBUtils');
const async = require('async');
const apply = async.apply;
const should = require('should');
const clientConfig = {
    host: 'localhost',
    port: '60001',
    endpointName: 'ActiveTestClient',
    url: '/pres',
    ipProtocol: 'udp4'
};
const ngsiClient = ngsiTestUtils.createNgsi(
    config.ngsi.contextBroker.host,
    config.ngsi.contextBroker.port,
    'dumbmordor',
    '/deserts'
);
let deviceInformation;

describe('Active attributes test', function () {
    beforeEach(function (done) {
        lwm2mClient.init(config);

        async.series(
            [
                apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host),
                apply(iotAgent.start, config),
                apply(lwm2mClient.registry.create, '/5000/0')
            ],
            function (error) {
                lwm2mClient.register(
                    clientConfig.host,
                    clientConfig.port,
                    clientConfig.url,
                    clientConfig.endpointName,
                    function (error, result) {
                        deviceInformation = result;
                        setTimeout(done, 1000);
                    }
                );
            }
        );
    });
    afterEach(function (done) {
        async.series(
            [
                apply(lwm2mClient.unregister, deviceInformation),
                iotAgent.stop,
                lwm2mClient.registry.reset,
                apply(mongoUtils.cleanDbs, config.ngsi.contextBroker.host)
            ],
            function (error, results) {
                done();
            }
        );
    });

    describe('When an active attribute changes a value in the device', function () {
        it('should update its value in the corresponding Orion entity', function (done) {
            async.series([async.apply(lwm2mClient.registry.setResource, '/5000/0', '2', '89')], function (error) {
                setTimeout(function () {
                    ngsiClient.query('ActiveTestClient:Pressure', 'Pressure', ['pressure'], function (
                        error,
                        response,
                        body
                    ) {
                        should.not.exist(error);
                        should.exist(body[0].pressure);
                        should.exist(body[0].pressure.value);
                        body[0].pressure.value.should.equal('89');
                        done();
                    });
                }, 1000);
            });
        });
    });

    describe('When an active attribute changes multiple values in the device', function () {
        function setLwm2mResource(objectUri, resourceId, resourceValue, callback) {
            setTimeout(function () {
                lwm2mClient.registry.setResource(objectUri, resourceId, resourceValue, callback);
            }, 500);
        }
        it('should last value should appear in Orion entity', function (done) {
            async.series(
                [
                    async.apply(setLwm2mResource, '/5000/0', '2', '89'),
                    async.nextTick,
                    async.apply(setLwm2mResource, '/5000/0', '2', '33'),
                    async.nextTick,
                    async.apply(setLwm2mResource, '/5000/0', '2', '19')
                ],
                function (error) {
                    setTimeout(function () {
                        ngsiClient.query('ActiveTestClient:Pressure', 'Pressure', ['pressure'], function (
                            error,
                            response,
                            body
                        ) {
                            should.not.exist(error);
                            should.exist(body);
                            body.should.be.instanceof(Array).and.have.lengthOf(1);
                            should.exist(body[0].pressure.value);
                            body[0].pressure.value.should.equal('19');
                            done();
                        });
                    }, 1000);
                }
            );
        });
    });
});
