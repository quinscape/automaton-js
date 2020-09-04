# "automaton-js" API

The following functions, classes and components are named exports of the 
internal "automaton-js" library. 

## Startup

### config

configuration object for automaton. Global constant client-side configuration is kept here. 

[See 'Automaton Configuration' for details](./config.md)

### startup

Starts the automaton application with the current process resulting from the URL mapping.

#### Example startup module

```js
import React from 'react';
import bootstrap from 'jsview-bootstrap'
import { configure } from "mobx"
import { startup, config } from "automaton-js"
import Layout from "../../components/Layout";

// set MobX configuration
configure({
    enforceActions: "observed"
});

bootstrap(
    initial => {
        return startup(
            require.context("./", true, /\.js$/),
            initial,
            () => {
                config.layout = Layout;
            }
        );
    },
    () => console.log("ready.")
);

module.exports = { config };
```
Here we see a complete startup for an Automaton application. After the necessary imports, MobX is configured.

Then we call the bootstrap module which calls our first callback with the initial data pushed from the server.

We call the startup function with the require context that dynamically loads all modules in the current app directory.
We give in the initial data and can optionally add a third callback argument that will be called after the default
initialization is done but before the current process is started. 

# Tracked Function

Calls to these tracked functions will be automatically detected by the "babel-plugin-track-usage" and provided as JSON
data to the server so that the server can prepare the translations and injections during end-point initialization.

### i18n

Translation function. Inserts the translation for a given translation tag and possibly arguments. If the translation tag 
accepts arguments, placeholders must be present in both tag name and translations

```js
import { i18n } from "automaton-js"
// ---------------------------------------

    const translated = i18n("Hello");
    const withArgument = i18n("Hello, {0}", name);
```

### injection

Injects the result of a single GraphQL query or mutation into a process scope variable.

In `apps/myapp/processes/customer/customer.js` :

```js
import {
    observable,
} from "mobx";

import { injection, type } from "automaton-js";

export default class CustomerScope {

    /** Current todos */
    @observable customers = injection(
        // language=GraphQL
        `{              
            getCustomers{
                rows{
                    id
                    number
                    salutation
                    name
                }
            }          
        }`
    );
}
```

### withAutomatonEnv

A high order component that will automatically inject an `env` prop with the current automaton environment into
a component

 
## UI Components

WIP

### DataGrid

WIP

### Button

WIP
