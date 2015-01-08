var iotAgentLib = require('fiware-iotagent-lib'),
    lwm2mLib = require('iotagent-lwm2m-lib').server,
    logger = require('logops'),
    async = require('async'),
    errors = require('./errors'),
    apply = async.apply,
    config,
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
    var name = id.substring(0, id.indexOf(':'));

    logger.debug(context, 'Handling device data query from the northbound for device [%s] of type [%s]', id, type);
    logger.debug(context, 'New attributes;\n%s', attributes);

    function readAttribute(deviceId, attribute, innerCallback) {
        if (config.ngsi.types[type].lwm2mResourceMapping[attribute]) {
            lwm2mLib.read(
                deviceId,
                config.ngsi.types[type].lwm2mResourceMapping[attribute].objectType,
                config.ngsi.types[type].lwm2mResourceMapping[attribute].objectInstance,
                config.ngsi.types[type].lwm2mResourceMapping[attribute].objectResource,
                innerCallback);

        } else {
            innerCallback(new Error('Couldn\'t find LWM2M mapping for attributes'));
        }
    }

    function readAttributes(device, innerCallback) {
        async.map(
            attributes,
            async.apply(readAttribute, device.id),
            innerCallback);
    }

    async.waterfall([
        async.apply(lwm2mLib.getRegistry().getByName, name),
        readAttributes
    ], callback);
}

/**
 * Handles a registration from the Lightweight M2M device. There are three scenarios:
 * - If the device has been registered before in the device registry, there is no registration needed.
 * - If the device is not registered, it should come with a URL, that can be used to guess its type. Once the type
 * has been detected, the rest of the information can be retrieved from the config file.
 *
 * @param endpoint
 * @param lifetime
 * @param version
 * @param binding
 * @param payload
 * @param callback
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
                device.name + ':' + device.type,
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

    iotAgentLib.unregister(device.name + ':' + device.type, device.type, callback);
}

function updateRegistration(object, callback) {
    logger.debug(context, 'Handling update registration of the device');

    callback(null);
}

function initialize(callback) {
    iotAgentLib.setDataUpdateHandler(ngsiUpdateHandler);
    iotAgentLib.setDataQueryHandler(ngsiQueryHandler);

    lwm2mLib.setHandler(serverInfo, 'registration', registrationHandler);
    lwm2mLib.setHandler(serverInfo, 'unregistration', unregistrationHandler);
    lwm2mLib.setHandler(serverInfo, 'updateRegistration', updateRegistration);

    logger.info(context, 'Agent started');
    callback();
}

function start(localConfig, callback) {
    config = localConfig;
    async.series([
        apply(lwm2mLib.start, localConfig.lwm2m),
        apply(iotAgentLib.activate, localConfig.ngsi)
    ], function (error, results) {
        if (error) {
            callback(error);
        } else {
            serverInfo = results[0];
            initialize(callback);
        }
    });
}

function stop(callback) {
    async.series([
        apply(lwm2mLib.stop, serverInfo),
        iotAgentLib.deactivate
    ], callback);
}

exports.start = start;
exports.stop = stop;