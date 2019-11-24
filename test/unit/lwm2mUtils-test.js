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

const lwm2mUtils = require('./../../lib/lwm2mUtils');
const should = require('should');
const expectedLwm2mObjects = ['/1/0', '/1/1', '/1/2', '/1/3', '/1/4', '/1/5', '/1/6'];

describe('lwm2mUtils test', function() {
    describe('When parse objects uri list is called with a comma separated list', function() {
        it('should should return an array with parsed resource paths', function(done) {
            const parsedLwM2MObjetcs = lwm2mUtils.parseObjectUriList(expectedLwm2mObjects.join(','));
            should.equal(JSON.stringify(expectedLwm2mObjects), JSON.stringify(parsedLwM2MObjetcs));
            done();
        });
    });

    describe('When parse objects uri list is called with a comma plus space separated list', function() {
        it('should should return an array with parsed resource paths', function(done) {
            const parsedLwM2MObjetcs = lwm2mUtils.parseObjectUriList(expectedLwm2mObjects.join(', '));
            should.equal(JSON.stringify(expectedLwm2mObjects), JSON.stringify(parsedLwM2MObjetcs));
            done();
        });
    });
});
