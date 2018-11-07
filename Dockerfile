# Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
#
# This file is part of the IoT Agent for the LigthweightM2M protocol (LM2M) component
#
# IOTA-LM2M is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the License,
# or (at your option) any later version.
#
# IOTA-LM2M is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with IOTA-LM2M.
# If not, see http://www.gnu.org/licenses/.
#
# For those usages not covered by the GNU Affero General Public License
# please contact with TeF IoT Team


ARG  NODE_VERSION=8.12.0-slim
FROM node:${NODE_VERSION}

MAINTAINER FIWARE IoTAgent Team. Telefónica I+D

COPY . /opt/iota-lwm2m
WORKDIR /opt/iota-lwm2m

RUN \
  apt-get update && \
  apt-get install -y git && \
  npm install -g grunt-cli && \
  echo "INFO: npm install --production..." && \
  cd /opt/iota-lwm2m && npm install --production && \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove

ENTRYPOINT bin/lwm2mAgent.js config-blank.js
