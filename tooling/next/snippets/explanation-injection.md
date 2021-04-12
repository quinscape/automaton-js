---
date: 2020-04-08
title: Automaton GraphQL Injection 
---
# Automaton GraphQL Injection

This document explains how we use data injection to cut down on the common problem of asynchronous data fetching

## Wild West Async Fetching

If we just head into things and follow the most common approach we write our frontend so that the react components 
themselves or some kind of state handling library fetches the data we need.

This often leads to two kinds of problems: First we incur a lot of request latency which quickly adds up to make our 
application seem slow and sluggish. Second while the responses of all the async requests are coming in, we have a lot of 
visual noise or even reflow while our components update to their final state.

## Cutting down the problem

Assuming GraphQL as data fetching method, we can categorize the data acquired into three groups

 * System data - internal / non-business-entity application data 
 * Data that comes from a GraphQL query whose variables are known at compile-time
 * Truly async requests
                       
In practice the number of data requests that fall into the last category is often very small if not zero.

Most of our data needs run along the lines of "Give me the first x rows of that table, sorted by y", maybe
with a filter. This is exactly what the InteractiveQuery system encapsulates.

## Data Injection

The data injection mechanism allows us to execute all GraphQL requests on the server and pass the data along the original
HTML document and then inject it into our process scopes. 

## Direct Data Injection

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
    
He we use an InteractiveQuery based query to request an InterativeQuery document containing the first five "Foo" entities. We can follow entity relations we have defined in our [GraphQLConfiguration.java]() 


