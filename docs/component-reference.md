# Automaton UI Components

## &lt;Button/&gt;



### Props

 Name | Type | Description 
------|------|-------------
action | func | Optional action function, receives the context as argument
className | string | Additional button classes
context | any | Explicitly sets the button context to the given object. If no context is given, the form base object of the surrounding form is used.
disabled | func | Additional function to check for disabled status. The default behavior is to disable the button if the button has a transition which is not discarding and there are form errors. This check runs before that and can disable the button in any case.
text | string | Text for the button
transition | string | Transition reference. button must have either a `transition` or an `action` attribute.
## &lt;CalendarField/&gt;



### Props

 Name | Type | Description 
------|------|-------------
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
inputClass | string | Additional HTML classes for the input element.
label | string | Label for the field.
labelClass | string | Additional HTML classes for the label element.
maxDate | instance of Date | Maximum date the user can select
minDate | instance of Date | Minimum date the user can select
mode | FieldMode value | Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for the calendar field value (e.g. "name", but also "foos.0.name")
placeholder | string | Placeholder text to render for text inputs.
tooltip | string | Tooltip / title attribute for the input element
## &lt;Link/&gt;

Special automaton link that can do process changes within the current page context.

You can use it like a normal link and if the URI patterns match, it will do its magic thing and otherwise
it will just be a link.

### Props

 Name | Type | Description 
------|------|-------------
className | string | Classes for the link element ( "link-internal" is added )
**href** (required) | string | Internal URI ( required )
role | string | Optional role attribute
title | string | Optional title attribute
## &lt;IQueryGrid/&gt;

Data grid what works based on degenerified InteractiveQuery types.

### Props

 Name | Type | Description 
------|------|-------------
filterTimeout | number | Timeout in milliseconds for the filter inputs. The actual update of the filter will be delayed until this many milliseconds have passed since the last filter change.
rowClasses | func | Function to produce additional classes for each row ( context => classes )
tableClassName | string | Additional classes to set on the table element. (default is "table-hover table-striped table-bordered")
workingSet | instance of WorkingSet | Working set with in-memory objects to be mixed in
# DataGrid Examples

If we have an GraphQL query injection like this

```js
class ExampleScope
{
    @observable
    foos = injection(
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
                    currentPage
                    pageSize
                    sortOrder{
                        fields
                    }
                }
                rows{
                    id
                    name
                    num
                    owner{
                        id
                        login
                    }
                    
                }
                rowCount
            }
        }`,
        {
            "config": {
                "pageSize": 20
            }
        }
    );
}
```

You can use a DataGrid component like this

```js
    <DataGrid
        value={ scope.foos }
    >
        <DataGrid.Column
            heading={ "Action" }
        >
            {
                foo => (
                    <Button
                        className="btn btn-secondary text-nowrap"
                        icon="fa-edit"
                        text="Detail"
                        action={ () => alert("Button for " + JSON.stringify(foo)) }
                    />
                )
            }
        </DataGrid.Column>
        <DataGrid.Column name="name" filter="containsIgnoreCase"/>
        <DataGrid.Column name="num" filter="eq"/>
        <DataGrid.Column name="owner.login" filter="containsIgnoreCase" />
    </DataGrid>
```

The columns render the scalar value when being self-closing and being given a field name.

Otherwise you can use a render function to render content. The render function receives the
current row object as only argument.

Simple filter comparisons can be given with the `filter` attribute.

The standard iQuery implementation is able to follow "to One" relations of object and request those with 
a single joined SQL query.

Here we follow a relation named `owner` to a corresponding `AppUser` object and display `owner.login` as column.   


## &lt;DataGrid.Column/&gt;

DataGrid column component

### Props

 Name | Type | Description 
------|------|-------------
filter | string or func | Either a JOOQ / Filter DSL comparison name or a custom filter function (see below)
heading | string | Column heading
name | string | Column name / path expression. (e.g. "name", but also "foo.owner.name")
sort | string or object | Field expression string or field expression FilterDSL map
# Custom Filter

A client-side custom filter can be defined by giving a function to `filter`.  

```js
<DataGrid.Column
    heading={ i18n("Sum") }
    filter={ (min,max) => (
        field("numa")
            .add(
                field(
                    "numb"
                )
            )
            .between(
                value(
                    "Int",
                    min
                ),
                value(
                    "Int",
                    max
                )
            )
    ) }
>
{
    (row) => row.sumA + row.sumB
}

The function can have one or more arguments.

</DataGrid.Column>


```
## &lt;DataGrid.RowSelector/&gt;

Row-Selection checkbox helper

### Props

 Name | Type | Description 
------|------|-------------
**id** (required) | any | Unique id string representing an object
**selectedValues** (required) | custom or custom | External observable containing the currently selected values. Either an observable array or set.
# Row Selection Example

To select rows, we need an additional observable set scope variable which tracks the currently
selected ids and can then be used in subsequent actions.

In this example it is called `selected`

```js
export default class RowSelectorExampleScope {

    @observable
    currentNode = null;

    /**
    * Contains the currently selected ids
    * @type {Set<*>}
    */
    @observable
    selected = new Set([]);

    /** Current todos */
    @observable
    nodes = injection(
        // language=GraphQL
            `query iQueryNode($config: QueryConfigInput!)
            {
                iQueryNode(config: $config)
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
                        currentPage
                        pageSize
                        sortOrder{
                            fields
                        }
                    }
                    rows{
                        id
                        name
                    }
                    rowCount
                }
            }`,
        {
            config: {
            }
        }
    );
}

```

Then you use the `<DataGrid.RowSelector/>` 

```js
<DataGrid
    id="animals-grid"
    value={ scope.nodes }
>
    <DataGrid.Column
        heading="Selection" 
    >
        {
            node => (
                <DataGrid.RowSelector
                    id={ node.id }
                    selectedValues={ scope.selected }
                />
            )
        }
    </DataGrid.Column>
    <DataGrid.Column name="name" />
</DataGrid>

```
## &lt;Tree/&gt;

Root tree component.

### Props

 Name | Type | Description 
------|------|-------------
aria-labelledby | string | Pass-trough attribute for the aria-labelledby of the tree.
id | string | Unique HTML element id for the tree
options | shape | Tree options
## options shape
 Name | Type | Description 
------|------|-------------
popperModifiers | object | Propper modifiers condiguration for the context menu.
small | bool | True if the tree should render small button variants.
## &lt;Tree.Objects/&gt;

Embeds a list of objects at the current level.

### Props

 Name | Type | Description 
------|------|-------------
actions | Array of shape | Array of menu entries with label and action function. The first action is the default action that is also executed on item click.
**render** (required) | func | Render function called once to render the item body for every row
**values** (required) | instance of InteractiveQuery | Injected InteractiveQuery instance.
## actions shape
 Name | Type | Description 
------|------|-------------
**action** (required) | func | Action function for the action
**label** (required) | string | Label for the action
## &lt;Tree.IndexedObjects/&gt;



### Props

 Name | Type | Description 
------|------|-------------
actions | Array of shape | Array of menu entries with label and action function. The first action is the default action that is also executed on item click.
index | Array of string | Index containing all initial unicode characters of entries in an array
nameField | string | Name field / path expression for the display name within the data rows. Default is "name"
**render** (required) | func | Render prop for a data row. Receives the row and returns a react element tree or simple renderable values.
renderIndex | func | Render prop for an index row. Receives the first unicode character and returns a react element tree or simple renderable values
**values** (required) | instance of InteractiveQuery | iQuery document, either injected or loaded with a wrapping <Tree.Folder/>
## actions shape
 Name | Type | Description 
------|------|-------------
**action** (required) | func | Action function for the action
**label** (required) | string | Label for the action
## &lt;Tree.Folder/&gt;

Renders a folder on the current level with a list of objects

### Props

 Name | Type | Description 
------|------|-------------
children | func | The method expects a single function as children which receives the iQuery document result.
**query** (required) | instance of GraphQLQuery | GraphQL query for this folder
render | func | Render prop that renders the folder header. If not given, an invisible folder is rendered that immediately executes its query and renders the items received on the same level.
variables | object | Query variables for the folder query.
## &lt;ScrollTracker/&gt;

Tracks position changes of focused input elements to counter-act them by setting scroll values

### Props

 Name | Type | Description 
------|------|-------------
**formConfig** (required) | instance of FormConfig | Form config of form to track.
