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
    types: [
        {
            name: 'Arduino',
            url: '/arduino'
        }
    ]
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
    types: {
        'Arduino': {
            service: 'arduino',
            subservice: '/devices',
            removeSuffix: true,
            commands: [],
            lazy: [],
            active: [
                {
                    name: 'D04',
                    type: 'string'
                },
                {
                    name: 'A0',
                    type: 'number'
                },
                {
                    name: 'A1',
                    type: 'number'
                }
            ],
            lwm2mResourceMapping: {
                'D00' : {
                    objectType: 5001,
                    objectInstance: 2,
                    objectResource: 0
                },
                'D01' : {
                    objectType: 5001,
                    objectInstance: 2,
                    objectResource: 1
                },
                'D02' : {
                    objectType: 5001,
                    objectInstance: 2,
                    objectResource: 2
                },
                'D03' : {
                    objectType: 5001,
                    objectInstance: 2,
                    objectResource: 3
                },
                'D04' : {
                    objectType: 5001,
                    objectInstance: 2,
                    objectResource: 4
                },
                'D05' : {
                    objectType: 5002,
                    objectInstance: 1,
                    objectResource: 5
                },
                'D06' : {
                    objectType: 5002,
                    objectInstance: 1,
                    objectResource: 6
                },
                'D07' : {
                    objectType: 5002,
                    objectInstance: 1,
                    objectResource: 7
                },
                'A0' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 0
                },
                'A1' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 1
                },
                'A2' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 2
                },
                'A3' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 3
                },
                'A4' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 4
                },
                'A5' : {
                    objectType: 5001,
                    objectInstance: 1,
                    objectResource: 5
                }
            }
        }
    },
    service: 'arduino',
    subservice: '/devices',
    providerUrl: 'http://192.168.56.1:4041',
    deviceRegistrationDuration: 'P1M'
};

module.exports = config;
