/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-lwm2m
 *
 * iotagent-lwm2m is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-lwm2m is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-lwm2m.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::daniel.moranjimenez@telefonica.com
 */

class UnknownInternalError {
    constructor(msg) {
        this.name = 'UNKNOWN_INTERNAL_ERROR';
        this.message = 'Unknown, unespecified internal error: ' + msg;
    }
}
class OmaRegistryConnectionError {
    constructor(msg) {
        this.name = 'OMA_REGISTRY_CONNECTION_ERROR';
        this.message = "Couldn't retrieve OMA Registry information due to a connection error: " + msg;
    }
}
class OmaRegistryServerError {
    constructor(status) {
        this.name = 'OMA_REGISTRY_SERVER_ERROR';
        this.message = 'Server error retrieving OMA Registry. Status code: ' + status;
    }
}
class TypeNotFound {
    constructor() {
        this.name = 'TYPE_NOT_FOUND';
        this.message = 'It was not possible to determine the type for the registering client';
    }
}
class OmaMappingNotFound {
    constructor() {
        this.name = 'OMA_MAPPING_NOT_FOUND';
        this.message = 'No OMA to NGSI Mapping found for this device or type';
    }
}

module.exports = {
    UnknownInternalError,
    OmaRegistryConnectionError,
    OmaRegistryServerError,
    TypeNotFound,
    OmaMappingNotFound
};
