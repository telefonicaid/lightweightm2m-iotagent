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

const iotAgentLib = require('iotagent-node-lib');
const lwm2mLib = require('lwm2m-node-lib').server;
const ngsiHandlers = require('./ngsiHandlers');
const registrationHandler = require('./services/lwm2mHandlers/registration');
const updateRegistrationHandler = require('./services/lwm2mHandlers/updateRegistration');
const unregistrationHandler = require('./services/lwm2mHandlers/unregistration');
const commons = require('./commons');
const logger = require('logops');
const async = require('async');
const apply = async.apply;
let config;
const context = {
    op: 'IOTAgent.Global'
};
let serverInfo;

/**
 * Initialize all the handlers of the IoT Agent and Lightweight M2M libraries.
 */
function initialize(callback) {
    iotAgentLib.setDataUpdateHandler(ngsiHandlers.ngsiUpdate);
    iotAgentLib.setDataQueryHandler(ngsiHandlers.ngsiQuery);
    iotAgentLib.setCommandHandler(ngsiHandlers.ngsiExecute);
    iotAgentLib.setConfigurationHandler(ngsiHandlers.updateConfiguration);

    lwm2mLib.setHandler(serverInfo, 'registration', registrationHandler.handler);
    lwm2mLib.setHandler(serverInfo, 'unregistration', unregistrationHandler.handler);
    lwm2mLib.setHandler(serverInfo, 'updateRegistration', updateRegistrationHandler.handler);

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
    commons.init(config);

    async.series([apply(lwm2mLib.start, localConfig.lwm2m), apply(iotAgentLib.activate, localConfig.ngsi)], function(
        error,
        results
    ) {
        if (error) {
            callback(error);
        } else {
            logger.info(context, 'IoT Agent services activated');
            serverInfo = results[0];
            initialize(callback);
        }
    });
}

/**
 * Stop the current IoT Agent instance.
 */
function stop(callback) {
    logger.info(context, 'Stopping IoT Agent');
    async.series([apply(lwm2mLib.stop, serverInfo), iotAgentLib.deactivate], callback);
}

exports.start = start;
exports.stop = stop;
