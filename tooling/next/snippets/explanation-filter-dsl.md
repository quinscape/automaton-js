---
title: Filter DSL 
date: 2021-04-08
---
<section>
# FilterDSL: Full-stack filtering 

The FilterDSL was initially developed for the needs of the InteractiveQuery mechanism but quickly grew into the 
general-purpose filtering tool it is now.


</section>

<section>
## Origins: JOOQ Conditions

The JOOQ library on which DomainQL is offers a typed Java DSL for writing complex SQL statements in Java. A part of this
is the JOOQ conditions in, for example in the WHERE clause.

The Automaton-Js FilterDSL is a JavaScript API modeled after that part of the JOOQ API.
                                                  

</section>

<section>
## Filter Execution Across the stack

The FilterDSL functions produce a JSON graph that can be transmitted to the server and back and that can be transformed
into an actual filter in three different ways now:

 * It can be transformed into a JOOQ condition that then gets executed as SQL
 * It can be transformed into a Java object filter. This is for example used to filter pub-sub messages for subscriptions.
 * It can be transformed into a JavaScript filter function
                                    
To be able to transmit the condition graphs from the server to the client and back via GraphQL, we have special scalar
implementations that handle that with structural validation. Semantic validation is up to the filter transformer.
                                                                                                                  
</section>

<section>
### SQL Execution

The SQL execution is baked into Interactive Query mechanism but can also be used independently of that.

```java
import de.quinscape.automaton.runtime.data.FilterTransformer;
import de.quinscape.automaton.runtime.data.FieldResolver;
import de.quinscape.automaton.runtime.data.SimpleFieldResolver;


// ...
class JOOQConditionExample
{
    
    // ...
    FilterTransformer transformer = new FilterTransformer();
    FieldResolver fieldResolver = new SimpleFieldResolver();
    Condition condition = transformer.transform(fieldResolver, conditionScalar);
}
```

The fieldResolver resolves `field("name")"` expressions to JOOQ field references. The SimpleFieldResolver uses normal
SQL semantics.


</section>

<section>
### Java Execution

    
```java
import de.quinscape.automaton.runtime.filter.JavaFilterTransformer;
import de.quinscape.automaton.runtime.filter.Filter;


// ...
class JavaFilterExample
{

    // ...
    JavaFilterTransformer transformer = new JavaFilterTransformer();
    // condition is a raw condition Map
    Filter filter = transformer.transform(condition);
}
```

</section>

<section>
### JavaScript Execution

```js
import { filterTransformer, FieldResolver } from "@quinscape/automaton-js"

const resolver = new FieldResolver();
const filterFn = filterTransformer(condition, resolver.resolve);

// ... set current object
resolver.current = { name: "test", num: 3542 };
// evaluate filterFn against the current object
if (filterFn())
{
    
}
```
                          
The [filterTransformer](/iquery#filterTransformer) returns a filter function that resolves field references via the resolver
factory.

The default FieldResolver resolves fields with normal JavaScript Object graph semantics. (lodash style paths, e.g. "rows.0.name")

</section>
