Static Configuration Guide
==================
# Index
* [Overview](#overview)
* [Installation](#overview)
* [Configuration](#overview)
* [Usage](#overview)

# <a name="overview"/> Overview
This guide will show the process of using the IoT Agent with a static configuration. In this use case, the owner of the
devices, before connecting each device, will create a static configuration for each device type. When a device is registered,
it will be assigned to one of the configured types, from where it will obtain all its configuration data.

This guide will use a Lightweight M2M client to simulate the interaction with the device. The installation and use of
this client will be explained when appropriate.

In this guide we will provide an explicit mapping for all the device attributes, using the `Robot` example given in the
[Getting Started](gettingStarted.md) section. Some of them could be mapped automatically using the OMA Registry 
automatic mapping (but those will be covered in other step-by-step guides).

# <a name="installation"/> Installation
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

# <a name="configuration"/> Configuration
In order to create the new configuration, backup the default `config.js` file and edit it with your new changes.

There are two groups of data that should be changed in the configuration in order for this example to work. First of all,
in order to connect the IoT Agent to the appropriate instance of the Context Broker, you should edit the following 
attributes:

* *config.ngsi.contextBroker.host*: host IP for the ContextBroker you will be using with the IoT Agent.
* *config.ngsi.providerUrl*: url where your IoT Agent will be listening for ContextProvider requests. Usually this will
be your machine's IP and the default port, but in case you are using an external context broker (or one deployed in 
a Virtual Machine) it may differ.

Once you have configured the connection information for the Context Broker, you must configure the information about the
device types you have in your system. Two attributes will have to be changed in order to acomplish this step:
* `config.lwm2m.types`: an entry should be added to this array with information on how to map URLs to types. Edit the config
file adding that information, as shown in the example:
```
config.lwm2m = {

    [...]

    types: [
        {
            name: 'Robot',
            url: '/robots'
        }
    ]
};
```
* `config.ngsi.types`: an entry should be added to this array with all the information about the type that is going to
be configured. This information will include an *ad-hoc* mapping for the attribute names to LWM2M URIs. Edit the config
file, as shown in the example:
```
config.ngsi = {
    
    [...]
    
    types: {
        'Robot': {
            service: 'Factory',
            subservice: '/robots',
            commands: [
              {
                "name": "Position",
                "type": "location"
              }            
            ],
            lazy: [
              {
                "name": "Message",
                "type": "string"
              }            
            ],
            active: [
              {
                "name": "Battery",
                "type": "number"
              }
            ],
            lwm2mResourceMapping: {
              "Battery" : {
                "objectType": 7392,
                "objectInstance": 0,
                "objectResource": 1
              },
              "Message" : {
                "objectType": 7392,
                "objectInstance": 0,
                "objectResource": 2
              },
              "Position" : {
                "objectType": 7392,
                "objectInstance": 0,
                "objectResource": 3
              }
            }
        }
    },
    
    [...]
};
```

You should change at least the log level, anyway, as in the default value (`FATAL`) it will show no information of 
what's going on with the execution.

# <a name="usage"/> Usage
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

## Provisionings
In this case, all the information that was needed in order to work with the Agent has been already configured in the
static configuration file, so there is no need for provisioning of neither devices nor configurations.

## Using the device
In order to use the device, change to the terminal where the client has been started. 

### Creation of the objects in the client
The first thing we should do before connecting to a LWM2M Server is to create the objects that the client will be serving.
The reason to perform this step before any other (specially before the registration) is that, during the registration of 
the client, it will send to the server a list of all its available objects, so the server can subscribe to those resources
configured by the client as active.

From the client console, type the following commands:
```
LWM2M-Client> create /7392/0
```
Once the object is created, give a default value for each of the attributes:
* Battery attribute:
```
LWM2M-Client> set /7392/0 1 89
```
* Message attribute:
```
LWM2M-Client> set /7392/0 2 "First robot here"
```
* Position attribute:
```
LWM2M-Client> set /7392/0 3 "[0, 0]"
```

### Connection to the server
Once all the objects are created in the device, connect with the server with the following command:
```
connect localhost 60001 robot1 /robots
```
A few notes about this command:
* First of all, note that the *endpoint name* used, `robot1`, is the same we provisioned in advance with the provisioning 
request.
* Note the url used is `/robots`. This is the URL we configured in the `config.lwm2m.types` attribute.

The following information should be presented in the client's console:
```
Connected:
--------------------------------
Device location: rd/2
```
This indicates that the server has accepted the connection request and assigned the `rd/2` location for the client's 
requests. This exact location may change from device to device (every device has a unique location).

If you configured the server in `DEBUG` mode, check the standard output to see what happened with the client registration.

Now you should be able to see the Entity in your Context Broker. You can do that with the following command:
```
(curl http://192.168.56.101:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
 --header 'Accept: application/json' --header 'fiware-service: Factory' --header 'fiware-servicepath: /robots' \
 -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Robot",
            "isPattern": "false",
            "id": "robot1:Robot"
        }
    ]
}
EOF
```
Note that the headers of the request to the Context Broker should match the ones you used in the Device Provisioning.

### Updating the active attributes
In order to update the value of an attribute, issue a new `set` command, like the following:
```
LWM2M-Client> set /7392/0 1 67
```
This should trigger an update to the Context Broker information. A new request for the stored information in the Context 
Broker should show the update.

### Reading lazy attributes
In order to read the lazy attributes, just make a query to the entity specifying the attribute you want to read, as in
the following case:
```
(curl http://192.168.56.101:1026/v1/queryContext -s -S --header 'Content-Type: application/json' \
 --header 'Accept: application/json' --header 'fiware-service: Factory' --header 'fiware-servicepath: /robots' \
 -d @- | python -mjson.tool) <<EOF
{
    "entities": [
        {
            "type": "Robot",
            "isPattern": "false",
            "id": "robot1:Robot"
        }
    ],
    "attributes" : [
        "Message"
    ]
}
EOF
```

### Sending a command to the device
Sending commands to a device works much the same as the updating of lazy attributes. In order to send a new command,
just update the command attribute in the Context Broker entity, with the following command:
```
(curl http://192.168.56.101:1026/v1/updateContext -s -S --header 'Content-Type: application/json' \
 --header 'Accept: application/json' --header 'fiware-service: Factory' --header 'fiware-servicepath: /robots' \
 -d @- | python -mjson.tool) <<EOF
{
    "contextElements": [
        {
            "type": "Robot",
            "isPattern": "false",
            "id": "robot1:Robot",
            "attributes": [
            {
                "name": "Position",
                "type": "location",
                "value": "[18,3]"
            }
            ]
        }
    ],
    "updateAction": "UPDATE"
}
EOF
```
