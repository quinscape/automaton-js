# Automaton UI Components

## &lt;Button/&gt;



### Props

 Name | Type | Description 
------|------|-------------
action | func | Optional action function, receives the context as argument
className | string | Additional button classes
context | any | Explicitly sets the button context to the given object. If no context is given, the form base object of the surrounding form is used.
disabled | func | Additional function to check for disabled status. The default behavior is to disable the button if the button has a transition which is not discarding and there are form errors. This check runs before that and can disable the button in any case.
icon | string | Icon class for the button
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
## &lt;Icon/&gt;

Simple FontAwesome Icon component

### Props

 Name | Type | Description 
------|------|-------------
brand | bool | true if icon is a brand icon
**className** (required) | string | Fontawesome icon as class name
title | string | Optional tooltip / title
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
## &lt;DataGrid/&gt;

Data grid what works based on degenerified Paged<DomainObject> types.

### Props

 Name | Type | Description 
------|------|-------------
rowClasses | func | Function to produce additional classes for each row ( context => classes )
tableClassName | string | Additional classes to set on the table element. (default is "table-hover table-striped table-bordered")
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
**id** (required) | string | Unique id string representing an object
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
## &lt;ScrollTracker/&gt;

Tracks position changes of focused input elements to counter-act them by setting scroll values

### Props

 Name | Type | Description 
------|------|-------------
**formConfig** (required) | instance of FormConfig | Form config of form to track.
