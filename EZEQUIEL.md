# Agente IoT LWM2M

## Cambios con respecto al código original de Telefónica I+D

At registration.js, added new filter isNotAlreadyMapped to avoid register twice the same element.

At ngsiHandlers.js, changed from 'prueba' literal to commandResult value.

Patched downloadOmaRegistry code to add operation information to json mappings.

Patched all dependencies at code to add omaInverseRegistry and omaRegistry instead of the names before used, 
to be coherent with downloadOmaRegistry.

At ngisHandlers, every read request is filtered if the element doesn't contain "R" operation.

At commonLwm2m, fixed a bug where you could not observe attributes explicitly programmed at internalAttributes.
