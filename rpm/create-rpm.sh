# Copyright 2015 Telefonica Investigacion y Desarrollo, S.A.U
#
# This file is part of Lightweight M2M IoT Agent.
#
# Lightweight M2M IoT Agent is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# Lightweight M2M IoT Agent is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
# General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with Orion Policy Enforcement Point. If not, see http://www.gnu.org/licenses/.
#
# For those usages not covered by this license please contact with
# iot_support at tid dot es

IOTA_VERSION=$2
if [ -z "$IOTA_VERSION" ]; then
  IOTA_VERSION=0.2.0
fi
IOTA_RELEASE=$1
if [ -z "$IOTA_RELEASE" ]; then
  IOTA_RELEASE=0
fi
RPM_TOPDIR=$PWD
IOTA_USER=iota

rpmbuild -ba $RPM_TOPDIR/SPECS/iotagentLwm2m.spec \
    --define "_topdir $RPM_TOPDIR" \
    --define "_project_user $IOTA_USER" \
    --define "_product_version $IOTA_VERSION" \
    --define "_product_release $IOTA_RELEASE"
