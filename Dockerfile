# Copyright 2015 Telefónica Investigación y Desarrollo, S.A.U
#
# This file is part of lightweightM2M-iotagent
#
# lightweightM2M-iotagent is free software: you can redistribute it and/or
# modify it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the License,
# or (at your option) any later version.
#
# lightweightM2M-iotagent is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License along with lightweightM2M-iotagent.
# If not, see http://www.gnu.org/licenses/.
#
# For those usages not covered by the GNU Affero General Public License
# please contact with: [daniel.moranjimenez@telefonica.com]
#
# Modified by: Daniel Calvo - ATOS Research & Innovation
#
ARG  NODE_VERSION=8.12.0-slim
FROM node:${NODE_VERSION}

MAINTAINER FIWARE IoTAgent Team. Telefónica I+D

COPY . /opt/iota-lwm2m
WORKDIR /opt/iota-lwm2m

RUN \
  apt-get update && \
  apt-get install -y git && \
  npm install pm2@3.2.2 -g && \
  echo "INFO: npm install --production..." && \
  cd /opt/iota-lwm2m && npm install --production && \
  # Clean apt cache
  apt-get clean && \
  apt-get remove -y git && \
  apt-get -y autoremove

USER node
ENV NODE_ENV=production

ENTRYPOINT ["pm2-runtime", "bin/lwm2mAgent.js"]
CMD ["-- ", "config.js"]