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

var config = {};

config.lwm2m = {
    logLevel: 'DEBUG',
    port: 5684,
    defaultType: 'Device',
    ipProtocol: 'udp4',
    serverProtocol: 'udp4',
    /**
     * When a LWM2M client has active attributes, the IOTA sends an observe instruction for each one, just after the
     * client registers. This may cause cause an error when the client takes too long to start listening, as the
     * observe requests may not reach its destiny. This timeout (ms) is used to give the client the opportunity to
     * create the listener before the server sends the requests.
     */
    delayedObservationTimeout: 50,
    formats: [
        {
            name: 'application-vnd-oma-lwm2m/text',
            value: 1541
        },
        {
            name: 'application-vnd-oma-lwm2m/tlv',
            value: 1542
        },
        {
            name: 'application-vnd-oma-lwm2m/json',
            value: 1543
        },
        {
            name: 'application-vnd-oma-lwm2m/opaque',
            value: 1544
        }
    ],
    writeFormat: 'application-vnd-oma-lwm2m/text',
    types: [ ]
};

config.ngsi = {
    logLevel: 'DEBUG',
    contextBroker: {
        host: '192.168.56.101',
        port: '1026'
    },
    server: {
        port: 4041
    },
    deviceRegistry: {
        type: 'mongodb',
 	host: 'localhost'
    },
    types: { },
    service: 'smartGondor',
    subservice: '/gardens',
    providerUrl: 'http://192.168.56.1:4041',
    deviceRegistrationDuration: 'P1M'
};

module.exports = config;

