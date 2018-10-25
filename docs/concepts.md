# Automaton Concepts

Automaton uses an intermediary JSON format, currently for composite components and process exports, to be extended as 
needed.


## Models

The current models are located in a fixed hierarchy in each automaton application.

```
Below src/main/webapp/WEB-INF/automaton:

    apps
    └── shipping
        └── processes
            ├── customer
            │   ├── composites
            │   │   └── CustomerList.json
            │   └── customer.json
            └── shipping
                ├── composites
                │   └── ShippingHome.json
                └── shipping.json
```



On the level below the `apps` folder is a directory for each app to run in one automaton servlet context.

Each app consists of several processes, each with its own folder in the `processes` folder. 

The process that is named like the app is the default process.

Each process is mapped to an URL.

This structure is mirrored starting at `src/main/js/apps/` with each JSON file corresponding to a generated JavaScript 
file at the same relative location.


### URL Mapping (WIP)

```
    https://example.com[/context]/<app>/[process/]...
```
 
 with `<app>` being the app name and `[process/]` being the optional name of the current process with a slash.
 If no process is given, the default process is used.
 
 `/context` is the servlet context path under which the automaton servlet application is running and might be empty.

 
### Model Extraction / Synchronization

In large parts, the model format is a simplified version of the Babel compiler AST und is collected by the 
"babel-plugin-automaton" NPM module during the js build. 

The package.json of the automaton applications defines to scripts to update the model information in either direction.

#### Commands

```shell 
yarn run js-to-model
```

Copies the current model.json into the model directory to commit the changes alongside the corresponding manual changes
to the generated JavaScript files.

Running the command enables the special BABEL_ENV activating the "babel-plugin-automaton". The build collects model
information from the JavaScript source files below `src/main/js/apps` and writes the data to model files below 
`src/main/webapp/WEB-INF/automaton/apps/`.

```shell 
yarn run model-to-js
```

Regenerates the Javascript sources at `src/main/js/apps/` from the model directory 
`src/main/webapp/WEB-INF/automaton/apps/`.


---
## Composite Components

Automaton Composite Components are a composite of other React components put together with a limited subset of the 
ECMA 6+ JavaScript and React component features freely available everywhere else.

The Composite Components are large, organizational components with different stereotypes.

 * View -- view component corresponding to a process state
 * Form -- Input-Form for a specific DomainQL type
 
 Other stereotypes might be added later, but they all follow the same composite model format.
 
 Let's look at composite view in  JavaScript 
 
 ```js
import React from "react"
import { observer } from "mobx-react";

import { DataGrid, Button, i18n } from "automaton-js"

@observer
class CustomerList extends React.Component {

    render()
    {
        const { env } = this.props;

        const { scope } = env;

        return (
            <div>
                <h1>
                    {
                        i18n('Customer List')
                    }
                </h1>
                <DataGrid
                    value={ scope.customers }
                >
                    <DataGrid.Column
                        heading={ i18n("Action") }
                    >
                        {
                            customer => (
                                <Button
                                    className="btn btn-secondary"
                                    icon="fa-edit"
                                    text="Detail"
                                    transition="to-detail"
                                    context={ customer }
                                />
                            )
                        }
                    </DataGrid.Column>
                    <DataGrid.Column name="number" />
                    <DataGrid.Column name="name" heading={ i18n("Customer:fullName") }>
                        {
                            customer => customer.salutation ? customer.salutation + " " + customer.name : customer.name
                        }
                    </DataGrid.Column>
                </DataGrid>
            </div>
        )
    }
}

export default CustomerList
 
```
 
We import the components and other modules we need for the view. All forms of ES6 imports are supported and mapped to
a simplified JSON structure.

The view contains one component that *must* be named the same as the module (without .js).  

The view component is decorated with mobx's `@observer` decoration. All decorations on the main component are preserved.

The view component just has a render function. We don't support any lifecycle methods, no local state. The composite 
component must be a dumb presentational component. We do however support adding high order components to those dumb 
components, so *if* there ever is a case where you absolutely feel like you need local state or lifecycle, wrapping the 
composite component in a HOC is the way to do.  

The composite component must be the default export. We record all HOCs applied during export.

Each view component will receive the Automaton `env` object as property automatically. For other composites, you might 
have to use the `withAutomatonEnv` HOC provided by NPM "automaton-js".

We support arbitrary preparation/deconstructing of constants at the top of the render method. Since conditional `const` 
definitions can be really awkward, you can also use `let` to define these conceptual constants. 

The return statement returns the JSX element tree for the composite component. Attributes can be strings or arbritary 
JSX expressions.

One kind of JSX expression we special case, which is any kind of render prop, be it passed as children or as attribute.

Here we see an example of such a render function passed to an attribute
  
 ```js
     return (
         
         <Widget 
            renderProp={ 
                ctx => {
                    
                    const { name } = ctx;
                    
                    return (
                        <AnotherComponent className="foo" value={ name } />
                    );
                }
            }
         />
     )
 ```
  
A render function receives one or multiple arguments passed in and can again define a block of arbitrary constants
before returning another JSX element tree for that function, all of which we extract separately as a model.


### Optional components

We do support logical chaining to enable optional components

 ```js
     return (
         condition && <Widget/>
     )
 ```
 
`condition` which can be any JavaScript expression is then registered as "renderedIf" attribute of the component JSON 
model.  


---
## Process Exports

Apart from the composite components we handle another type of Javascript files which are the multi-purpose modules 
providing the process exports. These modules are located inside each process directory. They have the same module name 
as the process.

The module can have arbitrary imports and is expected to provide two exports.

### initProcess function

 ```js

import CustomLayout from "../components/CustomLayout"

export function initProcess(process, scope)
{
    // process config
    process.layout = CustomLayout;
    process.generalHelper(12);

    // return process states and transitions
    return (
        {
            startState: "CustomerList",
            states: {
                "CustomerList": {
                    "to-detail":
                        {
                            to: "CustomerDetail",
                            action: scope.addTodo
                        }
                },
                "CustomerDetail": {
                    "save" : {
                        to: "CustomerList",
                        action: t => { process.back() }
                    },
                    "cancel" : {
                        to: "CustomerList"
                    }
                }
            }
        }
    );
}
```

The `initProcess` function (which must be defined with that exact signature above ) can do an initial configuration of 
process and scope and then returns the process map.

The process map is a multi level map `StateName -> TransitionName -> TransitionObject` (Java equivalent would be 
`Map<String,Map<String,Transition>>`)

Each state name must correspond to an existing composite view component in the process /composites/ folder.

Each transition name points to a transtion object that can have two properties

 * `to` -- contains the name of target state if that's a fixed state. If the state is chosen dynamically, the property
   may be missing.
           
 * `action` -- is either a function expression taking a transition object argument or a direct scope action reference.
   Can be left out if  the `to` property is set.
            
          
### Process Scope

The default export of the module must be a mobx decorated process scope definition which can have any name. The process 
scope defines the basic data-model for the process which is observed by the view components.

 ```js
import {
    observable,
    computed,
    action
} from "mobx";

import {
    injection,
    type
} from "automaton-js";

export default class TestScope {

    /* Current customers */
    @type("PagedCustomer")
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

    @action
    updateCustomers(customers)
    {
        this.customers = customers;
    }

    @computed
    get rowCount()
    {
        return this.customers.rowCount;
    }

    generalHelper(foo)
    {
        return foo + 1;
    }
}
```

It can contain four kinds of members:

 * Mobx `@observable` properties (`customers` above) that also carry a DomainQL type decoration. They can optionally use 
   the magic `injection` method to receive the result of a single GraphQL query or mutation in that observable property 
   without causing additional server round-trips. 
   Otherwise the source can define static default values.
 
 * Mobx `@action` methods (`updateCustomers` above)
 
 * Mobx `@computed` getters (`rowCount` above)
 
 * General helper methods to use in other locations.
   
