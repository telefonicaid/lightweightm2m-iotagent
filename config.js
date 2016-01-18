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
    port: 5683,
    defaultType: 'Device',
    ipProtocol: 'udp6',
    serverProtocol: 'udp6',
    formats: [{
        name: 'application-vnd-oma-lwm2m/text',
        value: 1541
    }, {
        name: 'application-vnd-oma-lwm2m/tlv',
        value: 1542
    }, {
        name: 'application-vnd-oma-lwm2m/json',
        value: 1543
    }, {
        name: 'application-vnd-oma-lwm2m/opaque',
        value: 1544
    }],
    writeFormat: 'application-vnd-oma-lwm2m/text',
    types: [{
        name: "IPex16",
        url: "/ipex16"
    }, {
        name: "Robot",
        url: "/robot"
    }, {
        name: "Device",
        url: "/"
    }]
};

config.ngsi = {
    logLevel: 'DEBUG',
    contextBroker: {
        host: '155.54.205.185',
        port: '1026'
    },
    server: {
        port: 4041
    },
    deviceRegistry: {
        type: 'mongodb',
        host: 'localhost'
    },
    types: {
        'Device': {
            "service": "odins",
            "subservice": "/",
            "removeSuffix": true,
            "active": [{
                "name": "Boton",
                "type": "Integer"
            }],
            "lazy": [{
                "name": "Led",
                "type": "Integer"
            }],
            "commands": [],
            "lwm2mResourceMapping": {
                "Boton": {
                    "objectType": 60000,
                    "objectInstance": 0,
                    "objectResource": 0
                },
                "Led": {
                    "objectType": 60000,
                    "objectInstance": 0,
                    "objectResource": 1
                }

            }
        }
    },
    service: 'odins',
    subservice: '/',
    providerUrl: 'http://155.54.205.214:4041',
    deviceRegistrationDuration: 'P1M'
};

module.exports = config;
