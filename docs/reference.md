# JSON reference

## Imports

All js based models contain the same JSON block that records the imports
in that module.

We support all syntax forms of ES6 imports

```js
import React from "react"
import { Original as Widget } from "../../components/ui"
import * as Another from "another-lib"
```

which will be turned into the following json block ( `"..." : true` symbolizing the missing type specific JSON data. )

```json
{
    "importDeclarations": [
        {
            "type": "ImportDeclaration",
            "source": "react",
            "specifiers": [
                {
                    "type": "ImportDefaultSpecifier",
                    "name": "React"
                }
            ]
        },
        {
            "type": "ImportDeclaration",
            "source": "../../components/ui",
            "specifiers": [
                {
                    "type": "ImportSpecifier",
                    "name": "Widget",
                    "aliasOf": "Original"
                }
            ]
        },
        {
            "type": "ImportDeclaration",
            "source": "another-lib",
            "specifiers": [
                {
                    "type": "ImportNamespaceSpecifier",
                    "name": "Another"
                }
            ]
        }
    ],
    
    "..." : true
}
```

In case there is no `Original as` clause in the second use case, the `"aliasOf"` property will be missing and it is thus
a signal to render that clause on the way back.

## Composite Components

Here we see the JavaScript source for a simple composite component. 

```js
import React from "react"

import { observer } from "mobx"

@observer
class SimpleComposite extends React.Component {

    render()
    {
        return (
            <div>
                <h1 className="test-class">SimpleComposite</h1>
            </div>
        )
    }
}

export default SimpleComposite
```
Composite components contain two more properties in addition to `"importDeclarations"`

```json
{
    "importDeclarations": [ "..." ],
    
    "composite": {
        "type": "CompositeComponent",
        "constants": [],
        "root": {
            "name": "div",
            "attrs": [],
            "kids": [
                {
                    "name": "h1",
                    "attrs": [
                        {
                            "type": "JSXAttribute",
                            "name": "className",
                            "value": {
                                "type": "Expression",
                                "code": "\"test-class\""
                            }
                        }
                    ],
                    "kids": [
                        {
                            "type": "JSXText",
                            "value": "SimpleComposite"
                        }
                    ],
                    "type": "JSXElement"
                }
            ],
            "type": "JSXElement"
        },
        "decorators": [
            {
                "name": "observer"
            }
        ]
    },
    "export": "SimpleComposite"
}
```
Composite components contain two more properties in addition to `"importDeclarations"`

The `"composite"` property contains actual composite component definition and the `"export"` key containing the source 
of the export declaration including all applied HOCs.

### Composite

The `"composite"` in turns contains two properties `"constants"` which we will explain below and the `"root"` property 
which contains a recursive structure of `"JSXElement"` typed objects.

Each has an `"attrs` key containing an array of `"JSXAttribute"` typed objects that have a `"name"` attribute with the attribute name 
and a `"value"` attribute that is either an "`Expression`" with a literal code `"code"` property or a `"RenderFunction"` object.

The `"kids"` property contains an array of further elements that can be either

 * `"JSXText"`typed with `"value"` string property
 * `"JSXExpressionContainer"`typed with literal `"code"` property
 * `"RenderFunction"` typed
 * and an `"JSXElement"` 


The `"decorators"` property contains a list of all decorators applied to the composite component. Each decorator
has a `"name"` property and potentially an `"arguments"` array with the source of all arguments. 

### Render Functions

Here we see a composite component demonstrating two advanced features: Render functions and constant declarations with
object patterns.

```js
import React from "react"
import { Widget } from "../../components/ui"

class RenderFunctionChild extends React.Component {

    render()
    {
        const { env : { contextPath : length } } = this.props;

        return (
            <Widget>
                {
                    context => {

                        const uri = "/xxx/" + context + "/" + length;

                        return (
                            <em>
                                {
                                    uri
                                }
                            </em>
                        )
                    }
                }
            </Widget>
        )
    }
}

export default RenderFunctionChild
```

Here's the JSON of that with the first complex constant left out

```json
{
    "importDeclarations": [ "..." ],
    "composite": {
        "type": "CompositeComponent",
        "constants": [
            {
                "type": "VariableDeclaration",
                "kind": "const",
                "declarations": [
                    "... left out ..."
                ]
            }
        ],
        "root": {
            "name": "Widget",
            "attrs": [],
            "kids": [
                {
                    "type": "JSXRenderFunction",
                    "params": [
                        {
                            "type": "Identifier",
                            "name": "context"
                        }
                    ],
                    "constants": [
                        {
                            "type": "VariableDeclaration",
                            "kind": "const",
                            "declarations": [
                                {
                                    "type": "VariableDeclarator",
                                    "id": {
                                        "type": "Identifier",
                                        "name": "uri"
                                    },
                                    "init": "\"/xxx/\" + context + \"/\" + length"
                                }
                            ]
                        }
                    ],
                    "root": {
                        "name": "em",
                        "attrs": [],
                        "kids": [
                            {
                                "type": "JSXExpressionContainer",
                                "code": "{uri}"
                            }
                        ],
                        "type": "JSXElement"
                    }
                }
            ],
            "type": "JSXElement"
        }
    },
    "export": "RenderFunctionChild"
}
```

The widget has a `"RenderFunction"` typed child which contains a `"params` array listing the arguments the 
render function accepts as a `"constants"` array with the normalish constant declaration for `uri`:

```js
    const uri = "/xxx/" + context + "/" + length;
```

```json
{
    "constants": [
        {
            "type": "VariableDeclaration",
            "kind": "const",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "uri"
                    },
                    "init": "\"/xxx/\" + context + \"/\" + length"
                }
            ]
        }
    ]
}
```

Each constant entry is a `"VariableDeclaration"` typed object with a `"kind` property containing either `"let"` or `"const"`.

Each `"VariableDeclaration"` can contain multiple `"VariableDeclarator"` that in the most simple case have an `"id"` property
with an `"Identifier"` typed object that has a `"name"` property.

### ObjectPattern

We are purposefully only supporting only a specific subset of all possible ECMAScript and React constructs but we want 
to support all of the constructs that we do support.

This gives us the same additional complication in two places: constant declarations and render function parameters.

Both can use arbitrarily complex destructuring.

Let's take a look at the complex example we left out above 

```js
    const { env : { contextPath : length } } = this.props;
```

This is an actually working but admittedly somewhat contrived example executing the following equivalent code.

```js
    const length = this.props.env.contextPath.length;
```

The resulting JSON forms another recursive structure

```json
{
    "type": "VariableDeclaration",
    "kind": "const",
    "declarations": [
        {
            "type": "VariableDeclarator",
            "id": {
                "type": "ObjectPattern",
                "properties": [
                    {
                        "type": "ObjectProperty",
                        "key": "env",
                        "value": {
                            "type": "ObjectPattern",
                            "properties": [
                                {
                                    "type": "ObjectProperty",
                                    "key": "contextPath",
                                    "value": {
                                        "type": "Identifier",
                                        "name": "length"
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            "init": "this.props"
        }
    ]
}
```

The `"id` property of the `"VariableDeclarator"` starts out with an `"ObjectPattern"` type that contains multiple
`"ObjectProperty"` type objects whose `"value"` property either contains another `"ObjectPattern"` or closes
off the chain with an `"Identifier"`

The same recursive "object pattern or identifier" thing happens for elements of the `"params"` array of the render function.
 
## Process Exports

```js
import {
    observable,
    computed,
    action
} from "mobx";

import CustomLayout from "../components/CustomLayout"

import {
    injection,
    type
} from "automaton-js";

// noinspection JSUnusedGlobalSymbols
export function initProcess(process, scope)
{
    // process config
    process.options.layout = CustomLayout;
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

The above results in the following JSON

```json
{
    "importDeclarations": [ "..." ],
    
    "processExports": {
        "type": "ProcessExports",
        
        "configuration": [
            "/* process config /*\n",
            "process.options.layout = CustomLayout",
            "process.generalHelper(12)"
        ],
        
        "process": {
            "startState": "\"CustomerList\"",
            "states": {
                "CustomerList": {
                    "to-detail": {
                        "to": "CustomerDetail",
                        "action": {
                            "type": "Action",
                            "params": [],
                            "code": "scope.addTodo()"
                        }
                    }
                },
                "CustomerDetail": {
                    "save": {
                        "to": "CustomerList",
                        "action": {
                            "type": "Action",
                            "params": [
                                "t"
                            ],
                            "code": "{ process.back(); }"
                        }
                    },
                    "cancel": {
                        "to": "CustomerList"
                    }
                }
            }
        },
        
        "scope": {
            "name": "TestScope",
            "observables": [
                {
                    "type": "PagedCustomer",
                    "name": "customers",
                    "defaultValue": "injection( // language=GraphQL\n`{\n                getCustomers{\n                    rows{\n                        id\n                        number\n                        salutation\n                        name\n                    }\n                }\n            }`)",
                    "description": "Current customers"
                }
            ],
            "actions": [
                {
                    "name": "updateCustomers",
                    "params": [
                        "customers"
                    ],
                    "code": "this.customers = customers;"
                }
            ],
            "computeds": [
                {
                    "name": "rowCount",
                    "code": "return this.customers.rowCount;"
                }
            ],
            "helpers": [
                {
                    "name": "generalHelper",
                    "params": [
                        "foo"
                    ],
                    "code": "return foo + 1;"
                }
            ]
        },
        "extraConstants": []
    }
}
```

In addition to the imports the we have a `"processExports"` object. 

It has a `"configuration"` array which contains the code and the comments of all scope and process related configuration.
(In detail that means that we accept any assignment expression or method call that refers to process or scope including its
leading comments).

The `"process"` property contains the transformed process map. Each action function is tranformed into an `"Action"` typed
object with `"name"` property, `"params"` array that contains at most one transition parameter and a `"code"` property
containing the actual action code.

The `"startState"` property contains the source of the initial start state, either a static view state name as string literal
or a transition function expression.

The `"scope"` property contains a `"name"` property and four array properties containing the collected member types.

The `"extraConstants"` property contains an array of extra definitions for the process. These can be constants and
functions, exported or not.

### observables
name          | description
--------------|------------  
name          | name of the @observable
type          | DomainQL type name
defaultValue  | code of the default value
description   | description text


### actions
name          | description
--------------|------------  
name          | name of the @action
params        | Array of action arguments
code          | action code


### computeds
name          | description
--------------|------------  
name          | name of the @computed
code          | computer getter code


### helpers
name          | description
--------------|------------  
name          | name of the helper
params        | Array of helper arguments
code          | helper code
