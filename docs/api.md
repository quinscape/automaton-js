# "automaton-js" API

The following functions, classes and components are named exports of the 
internal "automaton-js" library. 

## Startup

### configuration

configuration function for automaton. Can either by called without arguments
to receive the current configuration or with an object to set the current 
configuration.

Configuration key | Description|
------------------|-----------------------
layout            | Default Layout Component
translations      | Map of translation tags to translated messages 

```js
    configuration({
        layout: Layout,
        translations: initial.translations
    });
```

### renderProcess

Starts a new root process from the myapp-app.js files

```js
    return renderProcess(
        initial,
        require.context("./processes/", true, /\.js$/)

    );
```

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
    @type("PagedTodo")
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

### type

Our @type decorator which can also be seen above.

### withAutomatonEnv

A high order component that will automatically inject an `env` prop with the current automaton environment into
a component

 
## UI Components

WIP

### DataGrid

WIP

### Button

WIP
