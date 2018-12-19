Summary: Lightweight M2M IoT Agent
Name: iotagent-lwm2m
Version: %{_product_version}
Release: %{_product_release}
License: AGPLv3
BuildRoot: %{_topdir}/BUILDROOT/
BuildArch: x86_64
Requires: nodejs >= 0.10.24
Requires: logrotate
Requires(post): /sbin/chkconfig, /usr/sbin/useradd npm
Requires(preun): /sbin/chkconfig, /sbin/service
Requires(postun): /sbin/service
Group: Applications/Engineering
Vendor: Telefonica I+D
BuildRequires: npm

%description
The Lightweight M2M IoT Agent works as a gateway from LWM2M powered devices to the NGSI
applications defined by FIWARE. IoT Agent behavior is described in FIWARE's documentation
as well as in the README.md documentation that can be found in the root of the project.

# System folders
%define _srcdir $RPM_BUILD_ROOT/../../..
%define _service_name iotagent-lwm2m
%define _install_dir /opt/iotagent-lwm2m
%define _ioteagentlwm2m_log_dir /var/log/iotagent-lwm2m

# RPM Building folder
%define _build_root_project %{buildroot}%{_install_dir}
# -------------------------------------------------------------------------------------------- #
# prep section, setup macro:
# -------------------------------------------------------------------------------------------- #
%prep
echo "[INFO] Preparing installation"
# Create rpm/BUILDROOT folder
rm -Rf $RPM_BUILD_ROOT && mkdir -p $RPM_BUILD_ROOT
[ -d %{_build_root_project} ] || mkdir -p %{_build_root_project}

# Copy src files
cp -R %{_srcdir}/lib \
      %{_srcdir}/bin \
      %{_srcdir}/config.js \
      %{_srcdir}/package.json \
      %{_srcdir}/omaRegistry.json \
      %{_srcdir}/omaInverseRegistry.json \
      %{_srcdir}/LICENSE \
      %{_build_root_project}

cp -R %{_topdir}/SOURCES/etc %{buildroot}

# -------------------------------------------------------------------------------------------- #
# Build section:
# -------------------------------------------------------------------------------------------- #
%build
echo "[INFO] Building RPM"
cd %{_build_root_project}

# Only production modules
rm -fR node_modules/
npm cache clear
npm install --production

# -------------------------------------------------------------------------------------------- #
# pre-install section:
# -------------------------------------------------------------------------------------------- #
%pre
echo "[INFO] Creating %{_project_user} user"
grep ^%{_project_user}: /etc/passwd
RET_VAL=$?
if [ "$RET_VAL" != "0" ]; then
      /usr/sbin/useradd -s "/bin/bash" -d %{_install_dir} %{_project_user}
      RET_VAL=$?
      if [ "$RET_VAL" != "0" ]; then
         echo "[ERROR] Unable create %{_project_user} user" \
         exit $RET_VAL
      fi
fi

# -------------------------------------------------------------------------------------------- #
# post-install section:
# -------------------------------------------------------------------------------------------- #
%post
echo "[INFO] Configuring application"

    echo "[INFO] Creating the home IoTAgent directory"
    mkdir -p _install_dir
    echo "[INFO] Creating log directory"
    mkdir -p %{_ioteagentlwm2m_log_dir}
    chown -R %{_project_user}:%{_project_user} %{_ioteagentlwm2m_log_dir}
    chown -R %{_project_user}:%{_project_user} _install_dir
    chmod g+s %{_ioteagentlwm2m_log_dir}
    setfacl -d -m g::rwx %{_ioteagentlwm2m_log_dir}
    setfacl -d -m o::rx %{_ioteagentlwm2m_log_dir}

    echo "[INFO] Configuring application service"
    cd /etc/init.d
    chkconfig --add %{_service_name}

echo "Done"

# -------------------------------------------------------------------------------------------- #
# pre-uninstall section:
# -------------------------------------------------------------------------------------------- #
%preun

echo "[INFO] stoping service %{_service_name}"
service %{_service_name} stop &> /dev/null

if [ $1 == 0 ]; then

  echo "[INFO] Checking Context Broker installations"
  service --status-all |grep contextBroker
  CONTEXT_BROKER=$?

  echo "[INFO] Removing application log files"
  # Log
  [ -d %{_ioteagentlwm2m_log_dir} ] && rm -rfv %{_ioteagentlwm2m_log_dir}

  echo "[INFO] Removing application files"
  # Installed files
  [ -d %{_install_dir} ] && rm -rfv %{_install_dir}

  echo "[INFO] Removing application user"
  userdel -fr %{_project_user}

  echo "[INFO] Removing application service"
  chkconfig --del %{_service_name}
  rm -Rf /etc/init.d/%{_service_name}
  echo "Done"
fi

# -------------------------------------------------------------------------------------------- #
# post-uninstall section:
# clean section:
# -------------------------------------------------------------------------------------------- #
%postun
%clean
rm -rf $RPM_BUILD_ROOT

# -------------------------------------------------------------------------------------------- #
# Files to add to the RPM
# -------------------------------------------------------------------------------------------- #
%files
%defattr(755,%{_project_user},%{_project_user},755)
%config /etc/init.d/%{_service_name}
%config /etc/sysconfig/logrotate-iotagentlwm2m-size
%config /etc/logrotate.d/logrotate-iotagentlwm2m.conf
%config /etc/cron.d/cron-logrotate-iotagentlwm2m-size
%{_install_dir}

%changelog
* Wed Dec 19 2018 Fermin Galan <fermin.galanmarquez@telefonica.com>> 1.0.0-1
- Set Nodejs 6.14.4 as minimum version in packages.json (effectively removing Nodev4 as supported version)
- Add: allow NGSIv2 for updating active attributes at CB, through configuration (#104)
- Add: supports NGSIv2 for device provisioning (entity creation and context registration) at CB (#104)
- Add: npm scripts to execute tests, coverage, watch and clean
- Add: use NodeJS 8 in Dockerfile
- Add: use PM2 in Dockerfile
- Fix: unit tests are executed as part of travis CI
- Fix: issues in the provisioning API (#99 and #100) as result of npm-shrinkwrap file update
- Fix: active attributes are not updated in CB for preregistered devices (#107)
- Fix: update registration requests coming from devices are not correctly handled (#109)
- Fix: correct device provisioning example (#117)
- Fix: use master branch of lwm2m-node-lib (#120)
- Fix: correct example for configuration provisioning (#113)
- Fix: correct management of active attributes for configuration provisoning (#113)
- Fix: first observable value is processed and forwarded to the CB (#73)
- Upgrade: iotagent-node-lib dependence from master to 2.8.1
- Upgrade: lwm2m-node-lib dependence from 0.5.0 to 1.1.0
- Upgrade: async dependence from 1.5.2 to 2.6.1
- Upgrade: request dependence from ~2.69.0 to ~2.88.0
- Upgrade: underscore dependence from 1.8.3 to 1.9.1
- Upgrade: logops dependence from 1.0.0-alpha.7 to 2.1.0
- Upgrade: xmldom dependence from 0.1.22 to 0.1.27
- Upgrade: cheerio dependence from 0.20.0 to 1.0.0-rc.2
- Upgrade: nock development dependence from 0.48.0 to 10.0.2
- Upgrade: mocha development dependence from 2.4.5 to 5.2.0
- Upgrade: should development dependence from 8.4¡2.2 to 13.2.3
- Upgrade: istanbul development dependence from ~0.1.34 to ~0.4.5
- Ensure precise dependencies (~=) are used in packages.json
- Remove mongodb dependence from packages.json (already in iota-node-lib)
- Remove: old unused development dependencies (closure-linter-wrapper, sinon-chai, sinon, chai, grunt and grunt related modules)

