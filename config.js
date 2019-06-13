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
     * When a LWM2M client has active attributes, the IoT Agent sends an observe instruction for each one, just after the
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
    types: []
};

config.ngsi = {
    logLevel: 'DEBUG',
    timestamp: true,
    contextBroker: {
        host: 'localhost',
        port: '1026'
    },
    server: {
        port: 4041
    },
    deviceRegistry: {
        //type: 'memory'
        type: 'mongodb'
    },
    mongodb: {
        host: 'localhost',
        port: '27017',
        db: 'iotagentlm2m'
        //replicaSet: ''
    },
    types: {},
    service: 'smartGondor',
    subservice: '/gardens',
    providerUrl: 'http://localhost:4041',
    deviceRegistrationDuration: 'P1Y',
    defaultType: 'Thing'
};

/**
 * Configuration for secured access to instances of the Context Broker secured with a PEP Proxy.
 * For the authentication mechanism to work, the authentication attribute in the configuration has to be fully
 * configured, and the authentication.enabled subattribute should have the value `true`.
 *
 * The Username and password should be considered as sensitive data and should not be stored in plaintext.
 * Either encrypt the config and decrypt when initializing the instance or use environment variables secured by
 * docker secrets.
 */
// config.authentication: {
//enabled: false,
/**
 * Type of the Identity Manager which is used when authenticating the IoT Agent.
 * Either 'oauth2' or 'keystone'
 */
//type: 'keystone',
/**
 * Name of the additional header passed to retrieve the identity of the IoT Agent
 */
//header: 'Authorization',
/**
 * Hostname of the Identity Manager.
 */
//host: 'localhost',
/**
 * Port of the Identity Manager.
 */
//port: '5000',
/**
 * URL of the Identity Manager - a combination of the above
 */
//url: 'localhost:5000',
/**
 * KEYSTONE ONLY: Username for the IoT Agent
 *  - Note this should not be stored in plaintext.
 */
//user: 'IOTA_AUTH_USER',
/**
 * KEYSTONE ONLY: Password for the IoT Agent
 *    - Note this should not be stored in plaintext.
 */
//password: 'IOTA_AUTH_PASSWORD',
/**
 * OAUTH2 ONLY: URL path for retrieving the token
 */
//tokenPath: '/oauth2/token',
/**
 * OAUTH2 ONLY: Flag to indicate whether or not the token needs to be periodically refreshed.
 */
//permanentToken: true,
/**
 * OAUTH2 ONLY: ClientId for the IoT Agent
 *    - Note this should not be stored in plaintext.
 */
//clientId: 'IOTA_AUTH_CLIENT_ID',
/**
 * OAUTH2 ONLY: ClientSecret for the IoT Agent
 *    - Note this should not be stored in plaintext.
 */
//clientSecret: 'IOTA_AUTH_CLIENT_SECRET'
//};

module.exports = config;
