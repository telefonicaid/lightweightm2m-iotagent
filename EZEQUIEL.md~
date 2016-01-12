# Agente IoT LWM2M

## Cambios con respecto al código original de Telefónica I+D

En registration.js, se añade el filtro isNotAlreadyMapped para no registrar dos veces el mismo dispositivo.

En ngsiHandlers.js, se cambia 'prueba' por commandResult.

Añado en downloadOmaRegistry código para que añada también la información de operation.

Modifico todo el código para que incluya omaInverseRegistry en vez de omaRegistryInverseMap.

En ngsiHandlers, cuando se hace una petición de lectura, filtro todo atributo que no tenga "R" en operation.

En commonLwm2m corrijo un problema que no permite observar atributos que no estén explícitamente
programados en el internalAttributes.
