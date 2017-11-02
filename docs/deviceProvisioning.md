Device Provisioning Guide
==================
# Index
* [Overview](#overview)
* [Installation](#overview)
* [Configuration](#overview)
* [Usage](#overview)

# <a name="overview"> Overview </a>
This guide will show the process of using the IoT Agent with device preprovisioning. In this use case, the owner of the
devices, before connecting each device, will provision the device information into the agent. Then, the device can register
itself in the server and start being used with the agent. 

This guide will use a Lightweight M2M client to simulate the interaction with the device. The installation and use of
this client will be explained when appropriate.

In this guide we will provide an explicit mapping for all the device attributes, using the `Robot` example given in the
[Getting Started](gettingStarted.md) section. Some of them could be mapped automatically using the OMA Registry 
automatic mapping (but those will be covered in other step-by-step guides).

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

You should change at least the log level to `DEBUG`, as in other levels it will show no information of 
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

## Provisioning the device
Before starting to use any device, the device must be provisioned. In this step, we'll be sending a preprovisioning 
request for a 'Robot' device. To send the preprovisioning request we will be using the `curl` command that comes installed 
with any Unix-like OS.

This request has to be sent to the administrative port of the IoT Agent (default value 4041), not to the
Lightweight M2M port. 

The following request provision the device with device ID `robot1`:
```
(curl localhost:4041/iot/devices -s -S --header 'Content-Type: application/json' \
  --header 'Accept: application/json' --header 'fiware-service: Factory' --header 'fiware-servicepath: /robots' \
  -d @- | python -mjson.tool) <<EOF
{
  "devices": [
      {
        "device_id": "robot1",
        "entity_type": "Robot",
        "attributes": [
          {
            "name": "Battery",
            "type": "number"
          }
        ],
        "lazy": [
          {
            "name": "Message",
            "type": "string"
          }
        ],
        "commands": [
          {
            "name": "Position",
            "type": "location"
          }
        ],
      "internal_attributes": {
        "lwm2mResourceMapping": {
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
LWM2M-Client> connect localhost 5684 robot1 /
```
A few notes about this command:
* First of all, note that the *endpoint name* used, `robot1`, is the same we provisioned in advance with the provisioning 
request.
* Note the url used is `/`. This is the default URL and should be used for those devices that are not part of a specific
configuration. For examples in how to use configuration, check the [Configuration Provisioning Guide](configurationProvisioning.md).

The following information should be presented in the client's console:
```
Connected:
--------------------------------
Device location: rd/1
```
This indicates that the server has accepted the connection request and assigned the `rd/1` location for the client's 
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
            "id": "Robot:robot1"
        }
    ]
}
EOF
```
Note that the headers of the request to the Context Broker should match the ones you used in the Device Provisioning. 
Another thing to note is the Entity ID: it is formed by the concatenation of the type and the Device ID, separated by a colon. 
This convention can be overriden in the provisioning request.

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
            "id": "Robot:robot1"
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
            "id": "Robot:robot1",
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

This action will trigger an Execute action in the client. It will also update the "<attribute>_status" field of the
entity with the "PENDING" value, stating the execution is pending of the client result.
