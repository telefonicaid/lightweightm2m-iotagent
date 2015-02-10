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
 */
'use strict';

var iotAgentLib = require('fiware-iotagent-lib'),
    lwm2mLib = require('iotagent-lwm2m-lib').server,
    ngsiHandlers = require('./ngsiHandlers'),
    lwm2mHandlers = require('./lwm2mHandlers'),
    logger = require('logops'),
    async = require('async'),
    apply = async.apply,
    config,
    context = {
        op: 'IOTAgent.Global'
    },
    serverInfo;

/**
 * Initialize all the handlers of the IoT Agent and Lightweight M2M libraries.
 */
function initialize(callback) {
    iotAgentLib.setDataUpdateHandler(ngsiHandlers.ngsiUpdate);
    iotAgentLib.setDataQueryHandler(ngsiHandlers.ngsiQuery);

    lwm2mLib.setHandler(serverInfo, 'registration', lwm2mHandlers.registration);
    lwm2mLib.setHandler(serverInfo, 'unregistration', lwm2mHandlers.unregistration);
    lwm2mLib.setHandler(serverInfo, 'updateRegistration', lwm2mHandlers.updateRegistration);

    logger.info(context, 'Agent started');
    callback();
}

/**
 * Start the IoT Agent using the selected config.
 *
 * @param {Object} localConfig          Configuration object to use in the IoT Agent.
 */
function start(localConfig, callback) {
    config = localConfig;
    logger.setLevel(config.lwm2m.logLevel);

    ngsiHandlers.init(config);
    lwm2mHandlers.init(config);

    async.series([
        apply(lwm2mLib.start, localConfig.lwm2m),
        apply(iotAgentLib.activate, localConfig.ngsi)
    ], function(error, results) {
        if (error) {
            callback(error);
        } else {
            serverInfo = results[0];
            initialize(callback);
        }
    });
}

/**
 * Stop the current IoT Agent instance.
 */
function stop(callback) {
    async.series([
        apply(lwm2mLib.stop, serverInfo),
        iotAgentLib.deactivate
    ], callback);
}

exports.start = start;
exports.stop = stop;
