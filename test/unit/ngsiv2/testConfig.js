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

var config = {};

config.lwm2m = {
    logLevel: 'FATAL',
    port: 60001,
    defaultType: 'Device',
    serverProtocol: 'udp4',
    deviceRegistry: {
        type: 'mongodb'
    },
    mongodb: {
        host: 'localhost',
        port: '27017',
        db: 'lwtm2m'
        //replicaSet: ''
    },
    types: [
        {
            name: 'Light',
            url: '/light'
        },
        {
            name: 'Pressure',
            url: '/pres'
        },
        {
            name: 'Robot',
            url: '/robot'
        }
    ]
};

// Configuration of the LWTM2M Client
//--------------------------------------------------
config.client = {
    lifetime: '85671',
    version: '1.0',
    logLevel: 'FATAL',
    observe: {
        period: 3000
    },
    ipProtocol: 'udp4',
    serverProtocol: 'udp4',
    formats: [
        {
            name: 'lightweightm2m/text',
            value: 1541
        }
    ],
    writeFormat: 'lightweightm2m/text'
};

config.ngsi = {
    logLevel: 'FATAL',
    contextBroker: {
        host: 'localhost',
        port: '1026',
        ngsiVersion: 'v2'
    },
    server: {
        port: 4041
    },
    deviceRegistry: {
        type: 'mongodb'
    },
    mongodb: {
        host: 'localhost',
        port: '27017',
        db: 'lwtm2m'
    },
    types: {
        'Light': {
            service: 'smartgondor',
            subservice: '/gardens',
            commands: [],
            lazy: [
                {
                    name: 'luminescence',
                    type: 'Lumens'
                }
            ],
            attributes: [
                {
                    name: 'status',
                    type: 'Boolean'
                }
            ],
            lwm2mResourceMapping: {
                'luminescence' : {
                    objectType: 6000,
                    objectInstance: 0,
                    objectResource: 3
                }
            }
        },
        'Pressure': {
            service: 'dumbmordor',
            subservice: '/deserts',
            commands: [],
            lazy: [],
            attributes: [
                {
                    name: 'status',
                    type: 'Boolean'
                },
                {
                    name: 'pressure',
                    type: 'bars'
                },
                {
                    name: 'position',
                    type: 'coordinates'
                }
            ],
            lwm2mResourceMapping: {
                'pressure' : {
                    objectType: 5000,
                    objectInstance: 0,
                    objectResource: 2
                },
                'position' : {
                    objectType: 67000,
                    objectInstance: 0,
                    objectResource: 1
                }
            }
        },
        'Robot': {
            service: 'smartgondor',
            subservice: '/gardens',
            commands: [
                {
                    name: 'position',
                    type: 'Array'
                }
            ],
            lazy: [],
            staticAttributes: [],
            attributes: [],
            lwm2mResourceMapping: {
                'position' : {
                    objectType: 9090,
                    objectInstance: 0,
                    objectResource: 0
                }
            }
        }
    },
    service: 'smartgondor',
    subservice: '/gardens',
    providerUrl: 'http://localhost:4041/v1',
    deviceRegistrationDuration: 'P1M'
};

module.exports = config;
