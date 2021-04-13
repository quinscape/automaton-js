---
title: GraphQL Injection 
date: 2021-04-08
---

<section>
# GraphQL Injection
This document explains how we use data injection to cut down on the common problem of asynchronous data fetching
</section>

<section>
## Wild West Async Fetching
If we just head into things and follow the most common approach we write our frontend so that the react components 
themselves or some kind of state handling library fetches the data we need.

This often leads to two kinds of problems: First we incur a lot of request latency which quickly adds up to make our 
application seem slow and sluggish. Second while the responses of all the async requests are coming in, we have a lot of 
visual noise or even reflow while our components update to their final state.
</section>

<section>
### Cutting down the problem

Assuming GraphQL as data fetching method, we can categorize the data acquired into three groups

 * System data - internal / non-business-entity application data 
 * Data that comes from a GraphQL query whose variables are known at compile-time
 * Truly async requests
                       
In practice the number of data requests that fall into the last category is often very small if not zero.

Most of our data needs run along the lines of "Give me the first x rows of that table, sorted by y", maybe
with a filter. This is exactly what the InteractiveQuery system encapsulates.
                                                 
<InjectionDiagram/>
</section>

<section>
## Data Injection

The data injection mechanism allows us to execute all GraphQL requests on the server and pass the data along the original
HTML document and then inject it into our process scopes. 
</section>

<section>
### Direct Data Injection

We started out with what we now call direct data injection.
                                
When we define a process scope class, we can use the [injection](/declarative-api#injection) function to declare a GraphQL query.

```js
export default class MyScope
{
    myFoos = injection(
        // language=GraphQL
        `query iQueryFoo($config: QueryConfigInput!)
        {
            iQueryFoo(config: $config)
            {
                # Interactive Query meta fields
                type
                columnStates{
                    name
                    enabled
                    sortable
                }
                queryConfig{
                    id
                    condition
                    offset
                    pageSize
                    sortFields
                }
                
                # payload rows
                rows{
                    id
                    name
                    owner{
                        login
                    }
                }
                rowCount
            }
        }`,
        {
            config: {
                pageSize: 5
            }
        }
    )
}       
```
    
He we use an InteractiveQuery based query to request an InterativeQuery document containing the first five "Foo" entities. 
We can follow entity relations we have defined in our [GraphQLConfiguration.java](/graphql-config) and the server-side 
iQuery mechanism will automatically use an optimized SQL statement using JOINs etc.

The call to `injection` will be tracked by "babel-plugin-track-usage" and be registered for the given process scope.

So when the server prepares the data for a process, it knows what queries to run in preparation. The JSON result of those
queries goes into the initial view data and is then injected into the process scopes. All necessary instantiations and
conversions will happen automatically. 

All "Date" and "Timestamp" scalars will be luxon DateTime instances and the system will also instantiate all type 
implementations that were registered.

Among those is a generic type definition for all GraphQL types that were degenerified from 
`de.quinscape.automaton.model.data.InteractiveQuery`, the Java-side container for InteractiveQuery documents.

This means that our injected `myFoos` is a 
[InteractiveQuery instance](https://github.com/quinscape/automaton-js/blob/master/src/model/InteractiveQuery.js) that
provides extra methods to operate on the iQuery document.

For example, if we want to manually trigger pagination for our `myFoos` we can just do

```js
    myFoos.update({ offset: 5}).then( () => { 
        // ... pagination has happened here ... 
    })
```
</section>

<section>
### Indirect Data Injection

If you have a lot of injections, direct data injection can become very long and confusing. This is why we created indirect
data injection.

With indirect data injection we introduce the concept of named queries. Named queries are created either in a "queries" 
folder as a sibling to the "processes" folder or in a process inside a "queries" folder.

No matter the location all queries share one namespace per application. 
</section>

<section>
### Indirect Injection Example
                                                        
The query is defined in its own file. For this example we assume the location to be  
"src/main/apps/processes/myProcess/queries/Q_Foo.js":

```js

import { query } from "@quinscape/automaton-js"

export default query(
    // language=GraphQL
        `query iQueryFoo($config: QueryConfigInput!)
    {
        
        iQueryFoo(config: $config)
        {
            type
            columnStates{
                name
                enabled
                sortable
            }
            queryConfig{
                id
                condition
                offset
                pageSize
                sortFields
            }
            rows{
                id
                name
                description
                num
                
                owner{
                    login
                }
            }
            rowCount
        }
    }`,
    {
        "config": {
            "pageSize": 5,
            "sortFields" : ["name"]
        }
    }
)
```

The `query` function is tracked and registers the query under the name of the module. (here "Q_Foo").                                                    

Now we can inject the name query into our project scope.

In "src/main/apps/processes/myProcess/myProcess.js": 


```js

import Q_Foo from "./queries/Q_Foo"

export default class MyScope
{
    myFoos = injection( Q_Foo )
}       
```
                             
The import must have the same name as the named query and the module. The system will follow the import and provide
the query data by executing the named query.
</section>

<section>
## True async requests

The remaining async requests are most often the direct result of user interaction. We get a list of the first five foos injected,
but pagination or resorting or filtering is an async request then. 

Often we will inject a paginated list of objects with only a few field selected and when the user then selects one
of those objects, we have a `Q_FooDetail` query which we executed async and filtered to the detail selection.


```js
import { FilterDSL } from "@quinscape/automaton-js"
import Q_FooDetail from "./queries/Q_FooDetail"

const { field, value } = FilterDSL;

// assume `id` to be the id property of the selected Foo object

Q_FooDetail.execute({
    config: {
        condition: field("id").eq(
            value(id)
        )
    }
}).then(({iQueryFoo}) => {
    // detail object is in iQueryFoo.rows[0]
})

```

In this example we assume another, more detailed named queries `Q_FooDetail` which we execute with a hand-crafted query
config object.

We use the FilterDSL API to define a condition on `Q_FooDetail`, i.e. that the id field should be our selected id value.
</section>