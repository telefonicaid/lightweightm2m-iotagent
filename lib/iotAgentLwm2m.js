var iotAgentLib = require('fiware-iotagent-lib'),
    lwm2mLib = require('iotagent-lwm2m-lib').server,
    logger = require('logops'),
    async = require('async'),
    config = require('./config'),
    errors = require('./errors'),
    apply = async.apply,
    context = {
        op: 'IOTAgent.Global'
    },
    serverInfo;


function ngsiUpdateHandler(id, type, attributes, callback) {
    logger.debug(context, 'Handling device data update from the northbound for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    callback(null);
}

function ngsiQueryHandler(id, type, attributes, callback) {
    logger.debug(context, 'Handling device data query from the northbound for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);
    callback(null);
}

/**
 * Handles a registration from the Lightweight M2M device. There are three scenarios:
 * - If the device has been registered before in the device registry, there is no registration needed.
 * - If the device is not registered, it should come with a URL, that can be used to guess its type. Once the type
 * has been detected, the rest of the information can be retrieved from the config file.
 */
function registrationHandler(endpoint, lifetime, version, binding, payload, callback) {
    logger.debug(context, 'Handling registration of the device');

    function findDevice(callback) {
        lwm2mLib.getRegistry().get(endpoint, callback);
    }

    function mapConfig(device, callback) {
        logger.debug(context, 'Mapping device found to NGSI register');

        if (device.type) {
            callback(
                null,
                device.id,
                device.type,
                null,
                config.ngsi.types[device.type].service,
                config.ngsi.types[device.type].subservice,
                config.ngsi.types[device.type].lazy
            );
        } else {
            logger.error(context, 'Type not found for device. It won\'t be given a connection');
            callback('Type not found for device');
        }
    }

    iotAgentLib.getDevice(endpoint, function (error, device) {
        if (error && error.name && error.name === 'ENTITY_NOT_FOUND') {
            logger.debug(context, 'Device register not found. Creating new device.');
            async.waterfall([
                async.apply(lwm2mLib.getRegistry().getByName, endpoint),
                mapConfig,
                iotAgentLib.register
            ], callback);
        } else if (error) {
            logger.debug(context, 'An error was encountered registering device.');
            callback(error);
        } else if (device) {
            logger.debug(context, 'Preregistered device found.');
            callback(null);
        } else {
            logger.debug(context, 'Impossible to find a proper way to deal with the registration');
            callback(
                new errors.UnknownInternalError('Impossible to find a proper way of dealing with the registration'));
        }
    });
}

function unregistrationHandler(device, callback) {
    logger.debug(context, 'Handling unregistration of the device');

    callback(null);
}

function updateRegistration(object, callback) {
    logger.debug(context, 'Handling update registration of the device');

    callback(null);
}

function initialize(error, results) {
    if (error) {
        console.log(error);
    } else {
        serverInfo = results[0];

        iotAgentLib.setDataUpdateHandler(ngsiUpdateHandler);
        iotAgentLib.setDataQueryHandler(ngsiQueryHandler);

        lwm2mLib.setHandler(serverInfo, 'registration', registrationHandler);
        lwm2mLib.setHandler(serverInfo, 'unregistration', unregistrationHandler);
        lwm2mLib.setHandler(serverInfo, 'updateRegistration', updateRegistration);

        logger.info(context, 'Agent started');
    }
}

function start() {
    async.series([
        apply(lwm2mLib.start, config.lwm2m),
        apply(iotAgentLib.activate, config.ngsi)
    ], initialize);
}

start();