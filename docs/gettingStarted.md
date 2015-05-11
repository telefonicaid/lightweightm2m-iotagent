Getting started with the OMA Lightweight M2M IoT Agent
==================

This document links a set of howtos oriented to give a quick step-by-step example on how to use the agent with 
different types of configurations. It's important to remark that those configuration options are not mutually exclusive:
an IoT Agent can have some device preprovisioned, some configuration groups defined and some static configurations also,
each for different types of devices.

Some the guides will share the use of a faked device type called `Robot` with the following characteristics:
* be part of the service `Factory` and subservice `/robots`.
* have an active attribute called `Battery` with type `number`, mapped to the LWM2M resource ID /7392/0/1.
* have a passive attribute called `Message` with type `string`, mapped to the LWM2M resource ID /7392/0/2.
* have a command attribute called `Position` with type `location`, mapped to the LWM2M resource ID /7392/0/3.

Some guides will show the use of the automatic OMA Registry mapping, using a faked device of type 'WeatherBaloon', 
with the following characteristics:
* be part of the service `Weather` and subservice `/baloons`.
* a passive attribute with resource ID /6/0/0 (Position: Longitude).
* a passive attribute with resource ID /6/0/1 (Position: Latitude).
* a passive attribute with resource ID /3303/0/0 (Temperature Sensor).
* an active attribute with resource ID /3312/0/0 (Power Control).

Each guide is presented with a brief explanation about its contents:

* [Device Provisioning Guide](deviceProvisioning.md): this guide shows how to configure and start an IoT Agent and use it
provisioning each device before sending its measures.
* [Configuration Provisioning Guide](configurationProvisioning.md): this guide shows how to configure a group of devices
for being autoprovisioned when they register in the agent.
* [Static Configuration Guide](staticConfiguration.md): this guide shows how to configure static routes that map incoming
devices to different statically configured types.