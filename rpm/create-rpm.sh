#!/bin/bash
# Copyright 2014 Telefonica Investigacion y Desarrollo, S.A.U
#
# This file is part of the Fiware PEP Proxy.
#
# the Fiware PEP Proxy is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# the Fiware PEP Proxy is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
# General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with the Fiware PEP Proxy. If not, see http://www.gnu.org/licenses/.
#
# For those usages not covered by this license please contact with
# iot_support at tid dot es

PROXY_VERSION=$2
if [ -z "$PROXY_VERSION" ]; then
  PROXY_VERSION=0.4.0_next
fi
PROXY_RELEASE=$1
if [ -z "$PROXY_RELEASE" ]; then
  PROXY_RELEASE=0
fi
RPM_TOPDIR=$PWD
PROXY_USER=pepproxy

rpmbuild -ba $RPM_TOPDIR/SPECS/pepProxy.spec \
    --define "_topdir $RPM_TOPDIR" \
    --define "_project_user $PROXY_USER" \
    --define "_product_version $PROXY_VERSION" \
    --define "_product_release $PROXY_RELEASE"
