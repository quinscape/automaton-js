
<section>
## FKSelector Examples

The new `<FKSelector/>` is a versatile widget but even easier to use and configure than before.
                       
The FK selector expects each foreign-key field to come with a complex object giving detail information about the current
selection. It will automatically both the scalar foreign key field as well as the associated reference object.
                
</section>

<section>
### Simple Example

```js
    <FKSelector
        name="quxAId"
        label="Qux A"
        display="quxA.name"
        query={ Q_QuxA }
        required={ true }
    />
```

This example above will provide a foreign key widget that shows the current selection and allows a new selection via
modal popup. The modal popup will contain a datagrid with a column for each of the fields selected in the query (except
"id", which must be selected). It will provide a containsIgnoreCase filter for every column. An additional column
contains a select button per row to select that object for the foreign key field.

The `name` prop references the scalar foreign key field. `label` provides the human-readable label. The `display` prop
can be either a string or a function `row => String` that renders the representation of the each row. Note that you
commonly will need to write defensive code in those functions that can deal with intermediary objects missing. For example

```js
    row => row.quxA && (row.quxA.name + "-" + row.quxA.description)
```

Defining the `display` prop as string will automatically be null-safe.

The `query` prop must be either a GraphQLQuery instance or an InteractiveQuery document. See [below](#in-memory-operation) how do to the latter.  


</section>

<section>
### Search Filter

Adding the `searchFilter` prop will turn the fk-selector into an autocomplete input. The design tries to find a 
compromise between ease and use and a11y in that it does not have a autocomplete popup which while formally valid
is not really optimal both in terms of a11y concerns as well as mobile usability. 

The current solution is that the input of the user is turned into a FilterDSL expression that gets evaluated. If there is
exactly one result, that result will be used as foreign key selection.

Having no or more than one match generates a form error.

The default behavior of the fk selector modal is to use the same searchFilter driven by a single external input instead 
of the column filter. You can change that behavior with the `modalFilter` prop
                                                                          
```js
    <FKSelector
        name="quxAId"
        label="Qux A"
        display="quxA.name"
        searchFilter="name"
        query={ Q_QuxA }
        required={ true }
    />
```

</section>

<section>
#### modalFilter Prop

option                      | description
----------------------------|------------
FKSelector.NO_FILTER        | Don't show any filter in the modal.
FKSelector.NO_SEARCH_FILTER | Suppress search filter and show the column filter in the modal instead.
FKSelector.COLUMN_FILTER    | Show the column filter in addition to the search filter in the modal. 

</section>

<section>
### Complex Search Filter
                            
The `searchFilter` prop can also be given a function that converts the current autocomplete input value into a FilterDSL
condition graph using the FilterDSL.

```js

    import { FilterDSL } from "@quinscape/automaton-js"
    const { field, value, or } = FilterDSL;

    <FKSelector
        name="quxAId"
        label="Qux A"
        display="quxA.name"
        searchFilter={
            val => or(
                field("name")
                    .containsIgnoreCase(
                        value(
                            val
                        )
                    ),
                field("description")
                    .containsIgnoreCase(
                        value(
                            val
                        )
                    )
            )
        }
        query={ Q_QuxA }
        required={ true }
    />
```

Here we check of either the name field or the description field of the quxA row contain the current autocomplete value.

</section>

<section>
### Special Behavior: Ambiguous matches

In the case of an ambiguous match where the search filter returns more than one result, the fk selector will preselect 
those results where possible.

If the search filter is enabled in the modal (default), any ambiguous match is repeated in the search filter in the modal.
A user can discover *why* his match failed and adapt to find a better search.

If no search filter is shown in the modal, but the search filter is a simple search filter, the fk selector will use the 
column filter of that column to preselect the ambiguous match.


</section>

<section>
## In-Memory Operation

Instead of performing actual search queries for search filter and modal selection operations, the fk selector can operate
with in-memory queries.

To enable that, it needs to be given an InteractiveQuery instance instead of a GraphQL query instance.
      
In your process:

```js
    class MyProcessScope
    {
        quxDs = injection( Q_QuxD_All )
        
    }
```
      
Your query then needs to be set up to disable pagination so that all results will be injected.

```js
import { query } from "@quinscape/automaton-js"

export default query(
    // language=GraphQL
    `query QuxD_Injected($config: QueryConfigInput!)
    {
        iQueryQuxD(config: $config)
        {
            type
            columnStates{
                name
                enabled
                sortable
            }
            queryConfig {
                id
                condition
                offset
                pageSize
                sortFields
            }
            rows {
                id
                name
                value
                description
            }
            rowCount
        }
    }`,
    {
        config: {
            // XXX: you need to set pageSize to 0 to disable pagination here
            pageSize: 0,
            sortFields: ["id"]
        }
    }
)
```

Finally, you can use the injected document for the fk selector

```js

    import { FilterDSL } from "@quinscape/automaton-js"
    const { field, value, or } = FilterDSL;

    <FKSelector
        name="quxAId"
        label="Qux A"
        display="quxA.name"
        searchFilter="name"
        query={ scope.quxDs }
        required={ true }
    />
```
        
The fk selector will run the search Filter and the modal filtering, sorting, pagination etc with a new GraphQL 
query implemention that can evaluate FilterDSL expressions on Javascript objects.

This is of course just an example. You can just as well hardcode your cached source document or generate it in some way.

</section>
