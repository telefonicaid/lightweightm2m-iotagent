Configuration Provisioning guide
==================
# Index
* [Overview](#overview)
* [Installation](#overview)
* [Configuration](#overview)
* [Usage](#overview)


# <a name="overview"> Overview </a>
This guide will show the process of using the IoT Agent with configuration provisioning. In this use case, the owner 
of the devices, before connecting each one of them, provisions a device configuration that will be shared among all the devices
of the same type. The pieces of information that will be used to distinguish between devices will be the `resource` and
the API key.

This guide will use a Lightweight M2M client to simulate the interaction with the device. The installation and use of
this client will be explained when appropriate.

This guide will make use of the automatic OMA Registry mapping, with the example of the `WeatherBaloon` defined in the
[Getting Started](userGuide.md#gettingstarted) section. So, the attributes will be defined exclusively by their name, and the mapping
from and to a full LWM2M Mapping (like /387/3/23) will be performed by the IoT Agent.

# <a name="installation"> Installation </a>
## Installation of the Agent
In order to install the agent, first of all, clone the Github repository:
```
git clone https://github.com/telefonicaid/lightweightm2m-iotagent.git
```
Once the repository is cloned, download the dependencies executing the following command from the root folder of the
project:
```
npm install
```

## Installation of the Client
In order to install the client, clone the following Github repository:
```
git clone https://github.com/telefonicaid/lwm2m-node-lib.git
```
And download the dependencies, executing, from the root folder of the project:
```
npm install
```

# <a name="configuration"> Configuration </a>
Most of the the default `config.js` file coming with the repository should meet your needs for this guide, but there 
are two attributes that you will want to tailor:

- *config.ngsi.contextBroker.host*: host IP for the ContextBroker you will be using with the IoT Agent.
- *config.ngsi.providerUrl*: url where your IoT Agent will be listening for ContextProvider requests. Usually this will
be your machine's IP and the default port, but in case you are using an external context broker (or one deployed in 
a Virtual Machine) it may differ.


You should change at least the log level to `DEBUG`, as in other levels it will not show information of 
what's going on with the execution.

# <a name="usage"> Usage </a>

## Start the agent
In order to start the agent, from the root folder of the repository type:
```
bin/lwm2mAgent.js
```
This will execute the IoT Agent in the foreground, so you can see the logs of what's happening.

With the agent still open, in other terminal, open the Client, typing the following command from the client's root
folder
```
bin/iotagent-lwm2m-client.js
```

## Provisioning the configuration
Before starting to use any device a device configuration should be created. In this step we will create a configuration
for all the devices of type 'WeatherBaloon'. To send the configuration creation request we will be using the `curl` command 
that comes installed with any Unix-like OS.
 
This request has to be sent to the administrative port of the IoT Agent (default value 4041), not to the
Lightweight M2M port. 

The following request creates the configuration group for devices with type `WeatherBaloon`:
```
(curl localhost:4041/iot/services -s -S --header 'Content-Type: application/json' \
  --header 'Accept: application/json' --header 'fiware-service: weather' --header 'fiware-servicepath: /baloons' \
  -d @- | python -mjson.tool) <<EOF
{
  "services": [
    {
      "resource": "/weatherBaloon",
      "apikey": "",
      "type": "WeatherBaloon",
      "commands": [],
      "lazy": [
        {
          "name": "Longitude",
          "type": "double"
        },
        {
          "name": "Latitude",
          "type": "double"
        },
        {
          "name": "Temperature Sensor",
          "type": "degrees"
        }
      ],
      "attributes": [
        {
          "name": "Power Control",
          "type": "Boolean"
        }
      ]
    }
  ]
}
EOF
```

## Using the device
In order to use the device, change to the terminal where the client has been started. 

### Creation of the objects in the client
The first thing we should do before connecting to a LWM2M Server is to create the objects that the client will be serving.
The reason to perform this step before any other (specially before the registration) is that, during the registration of 
the client, it will send to the server a list of all its available objects, so the server can subscribe to those resources
configured by the client as active.

From the client console, type the following commands:
```
LWM2M-Client> create /6/0
LWM2M-Client> create /3303/0
LWM2M-Client> create /3312/0
```
Once the object is created, give a default value for each of the attributes:

* Longitude attribute:
```
LWM2M-Client> set /6/0 0 12
```
* Longitude attribute:
```
LWM2M-Client> set /6/0 1 -4
```
* Temperature attribute:
```
LWM2M-Client> set /3303/0 0 23
```
* Power attribute:
```
LWM2M-Client> set /3312/0 0 On
```

### Connection to the server
Once all the objects are created in the device, connect with the server with the following command:
```
LWM2M-Client> connect localhost 5684 weather1 /weatherBaloon
```
A few notes about this command:
* First of all, the *endpoint name* used, `weather1`, can be whatever ID available; the type of device and its features
will not be determined based on its Device ID, but based on the resource it is accessing.
* The URL is `/weatherBaloon` the same one we used in the previous step, in the Configuration provisioning.

The following information should be presented in the client's console:
```
Connected:
--------------------------------
Device location: rd/2
```
This indicates that the server has accepted the connection request and assigned the `rd/2` location for the client's 
requests. This exact location may change from device to device (every device has a unique location).

If you configured the server in `DEBUG` mode, check the standard output to see what happened with the client registration.

Now you should be able to see the Entity in your Context Broker. You can do that, querying any of the lazy attributes
with the following command:
```
(curl http://192.168.56.101:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
 --header 'Accept: application/json' --header 'fiware-service: weather' --header 'fiware-servicepath: /baloons' \
 -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "WeatherBaloon",
            "isPattern": "false",
            "id": "weather1:WeatherBaloon"
        }
    ],
    "attributes" : [
        "Latitude"
    ]    
}
EOF
```
Note that the headers of the request to the Context Broker should match the ones you used in the Configuration Provisioning.
