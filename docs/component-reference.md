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
tooltip | string | Text for the button
transition | string | Transition reference. button must have either a `transition` or an `action` attribute.
## &lt;CalendarField/&gt;



### Props

 Name | Type | Description 
------|------|-------------
addonClass | string | Additional HTML classes for the calendar button addon
autoFocus | bool | Pass-through autoFocus attribute for the Calendar input field
dateFormat | string | Date format string to use for "Date" typed fields.
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
inputClass | string | Additional HTML classes for the input element.
label | string | Label for the field.
labelClass | string | Additional HTML classes for the label element.
maxDate | instance of DateTime | Maximum date the user can select
minDate | instance of DateTime | Minimum date the user can select
mode | FieldMode value | Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for the calendar field value (e.g. "name", but also "foos.0.name")
placeholder | string | Placeholder text to render for text inputs.
timestampFormat | string | Date format string to use for "Timestamp" typed fields.
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
## DataGrid Examples

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
className | string or func | Additional classes to add to the cells for this column. Can be either string to apply to all columns or a function that produces classes given the row object ( row => classes )
filter | string or func | Either a JOOQ / Filter DSL comparison name or a custom filter function (see below)
heading | string | Column heading
name | string | Column name / path expression. (e.g. "name", but also "foo.owner.name")
sort | string or object | Field expression string or field expression FilterDSL map
## &lt;WorkingSetStatus/&gt;

Helper component to display a status icon with a tooltip for a data grid with working set.

### Props

 Name | Type | Description 
------|------|-------------
createdIcon | string | Icon to show for CREATED status (default "fa-asterisk")
createdTooltip | string | Tooltip to display for the CREATED icon
currentObj | object | Current data-grid row object. You should define either the currentObj prop or a pair of type and id prop.
deletedIcon | string | Icon to show for DELETED status (default "fa-trash-alt")
deletedTooltip | string | Tooltip to display for the DELETED icon
iconClass | string | Additional classes for all icons (default "m-2")
id | string | Id of the current object (alternative to defining the complete object via currentObj)
modifiedIcon | string | Icon to show for MODIFIED status (default "fa-edit")
modifiedTooltip | string | Tooltip to display for the MODIFIED icon
type | string | Type of the current object (alternative to defining the complete object via currentObj)
workingSet | instance of WorkingSet | Working set
## Custom Filter

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
## Row Selection Example

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
## Tree-Navigation

The tree can be used with both mouse and keyboard.

The care-buttons open and close tree groups and load additional data on demand.

Clicking on the name of the item executes the default action or first action in the `actions` definition.

( See [Tree.Objects](component-reference.md#treeobjects) and [Tree.IndexedObjects](component-reference.md#treeindexedobjects) )

The context-menu can be opened by right-clicking the name or combining
a normal click with either ctrl, shift or alt.

### Keyboard navigation
 
With the keyboard the menu can be opened by either pressing ctrl, shift
or alt while pressing the return key or by tabbing onto a visually
hidden context menu button with opens the same menu.

Navigation within the tree works via cursor keys. Up and Down move the selection
one item up or down. 'Home' and 'End' key select the first or last item in the tree.

Cursor left closes the current tree group or jumps to the current parent if
the group is already closed or the item has no descendants.

Cursor right opens the current tree group or jumps to the first descendant 
if the group is already open.
## &lt;Tree.Objects/&gt;

Embeds a list of objects at the current level.

### Props

 Name | Type | Description 
------|------|-------------
**actions** (required) | Array of shape | Array of menu entries with label and action function. The first action is the default action that is also executed on item click.
**render** (required) | func | Render function called once to render the item body for every row
**values** (required) | instance of InteractiveQuery | Injected InteractiveQuery instance.
## actions shape
 Name | Type | Description 
------|------|-------------
**action** (required) | func | Action function for the action
**label** (required) | string or func | Label for the action for function to render a decorated label
## <Tree.Objects/> Example

```js

<h1 id="animal-tree-title" className="sr-only">Animals</h1>
<Tree
    id="animal-tree"
    aria-labelledby="animal-tree-title"
>
    <Tree.Objects
        values={ iQuery }
        render={ (row,isSelected) => row.name }
        actions={
            [
                {
                    label: "Default Action",
                    action: row => ...
                },
                {
                    label: "Action 2",
                    action: row => ...
                }
            ]
        }
    />
</Tree>
```

Each row object within `iQuery` is rendered by calling the `render`
function with the current row object and the current selection status.

<Tree.Objects/> can have a render function child receiving the current
row object. The render function can render the descendant tree objects
for the row object.

The `actions` prop receives an array of action entries. The action
entries have a `label` and an `action` property. The `action` property
is a function receiving the row object for which the action was
triggered.

The first action is the default action which is triggered when the user
clicks on the name or presses return while the name is focused.
## &lt;Tree.IndexedObjects/&gt;



### Props

 Name | Type | Description 
------|------|-------------
**actions** (required) | Array of shape | Array of menu entries with label and action function. The first action is the default action that is also executed on item click.
altText | func | Function that produces an alt-text for each index item given the initial letter ( letter => altText ). Default is using `i18n("Toggle Items starting with {0}", letter)`
heading | string | Optional heading to display as separate item between main item and index item.
index | Array of string | Index containing all initial unicode characters of entries in an array
nameField | string | Name field / path expression for the display name within the data rows. Default is "name"
**render** (required) | func | Render prop for a data row. Receives the row and returns a react element tree or simple renderable values.
renderIndex | func | Render prop for an index row. Receives the first unicode character and returns a react element tree or simple renderable values
**values** (required) | instance of InteractiveQuery | iQuery document, either injected or loaded with a wrapping <Tree.Folder/>
## actions shape
 Name | Type | Description 
------|------|-------------
**action** (required) | func | Action function for the action
**label** (required) | string or func | Label for the action for function to render a decorated label
## &lt;Tree.Folder/&gt;

Renders an initially closed folder that quries additional children on demand.

### Props

 Name | Type | Description 
------|------|-------------
children | func | The method expects a single function as children which receives the iQuery document result. If onLoad is set the received value can be of arbitrary structure.
onLoad | func | Called when the folder data is loaded. This option is mutually exclusive with query/variables. The method must return a Promise or a sync value. The resolved value will be assigned to the internal storage. The exact same object will be fed to the children render function
query | instance of GraphQLQuery | GraphQL query for this folder. Will be ignored if the onLoad prop is set.
render | func | Render prop that renders the folder header. If not given, an invisible folder is rendered that immediately executes its query and renders the items received on the same level.
variables | object | Query variables for the folder query.
## &lt;ScrollTracker/&gt;

Tracks position changes of focused input elements to counter-act them by setting scroll values

### Props

 Name | Type | Description 
------|------|-------------
**formConfig** (required) | instance of FormConfig | Form config of form to track.
## &lt;StyleSwitcher/&gt;

Simple stylesheet switcher based on the server-side infrastructure around
de.quinscape.automaton.runtime.provider.AlternateStyleProvider.

### Props

 Name | Type | Description 
------|------|-------------
onChange | func | Optional change handler. If not set, the current selection is stored as cookie.
## &lt;FKSelector/&gt;

Renders the current value of foreign key references and allows changing of references via text-input and selection from
modal grid.

### Props

 Name | Type | Description 
------|------|-------------
autoFocus | bool | True to focus the fk selector input (See `searchFilter` )
cachedPageSize | number | Page size to use when using an in-memory iQuery document as data source. (Default is 5)
display | string or func | Property to use as display value or render function for the current value ( formConfig => ReactElement ). Can be used to extend on simple property rendering.
fade | bool | Whether to do the modal fade animation on selection (default is true)
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
inputClass | string | Additional HTML classes for the display value.
label | string | Label for the field. Must be defined if name is missing.
labelClass | string | Additional HTML classes for the label element.
modalFilter | enum | Filter mode for the selector modal. Controls display of column and repeated search filter in interaction with the searchFilter prop,
modalTitle | string | Title for the modal dialog selecting the target object
mode | FieldMode value | Mode for this foreign key selector. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for the foreign key value (e.g. "name", but also "foos.0.name").
placeholder | string | Placeholder for input (See `searchFilter`)
**query** (required) | instance of GraphQLQuery or instance of InteractiveQuery | iQuery GraphQL query to fetch the current list of target objects
searchFilter | string or func | Field name or function returning a filter expression used to allow and validate text-input changes of the selected value. The field or filter must match exactly one element from the current `query`. (Function must be of the form `value => ...` and must return a Filter DSL condition.)
searchTimeout | number | Timeout in ms after which the input will do the validation query ( default: 250).
tooltip | string | Tooltip / title attribute for the input element
## FKSelector Examples

The new `<FKSelector/>` is a versatile widget but even easier to use and configure than before.
                       
The FK selector expects each foreign-key field to come with a complex object giving detail information about the current
selection. It will automatically both the scalar foreign key field as well as the associated reference object.
                
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

#### modalFilter Prop

option                      | description
----------------------------|------------
FKSelector.NO_FILTER        | Don't show any filter in the modal.
FKSelector.NO_SEARCH_FILTER | Suppress search filter and show the column filter in the modal instead.
FKSelector.COLUMN_FILTER    | Show the column filter in addition to the search filter in the modal. 

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

### Special Behavior: Ambiguous matches

In the case of an ambiguous match where the search filter returns more than one result, the fk selector will preselect 
those results where possible.

If the search filter is enabled in the modal (default), any ambiguous match is repeated in the search filter in the modal.
A user can discover *why* his match failed and adapt to find a better search.

If no search filter is shown in the modal, but the search filter is a simple search filter, the fk selector will use the 
column filter of that column to preselect the ambiguous match.


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
## &lt;AssociationSelector/&gt;

Displays the currently associated entities of a many-to-many relationship as seen from one of the associated sides.

### Props

 Name | Type | Description 
------|------|-------------
**display** (required) | string or func | Path to use as display value for associations or render function for associations ( linkObj => ReactElement ).
fade | bool | Whether to do the modal fade animation on selection (default is true)
formGroupClass | string | Additional HTML classes for the form group element.
generateId | func | Function to return a new id value for newly created associations. Note that you can use placeholder id values. Default is to create a new UUID (NPM "uuid" v4).
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
label | string | Label for the field. Must be defined if name is missing.
labelClass | string | Additional HTML classes for the label element.
modalTitle | string | Title for the modal dialog selecting the target object
mode | FieldMode value | Mode for this calendar field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
name | string | Name / path for the association selector field. In contrast to most normal fields this does not point to a scalar value but to list of associative entity / link table fields with embedded target objects
onNew | func | Optional callback function that is called for every newly created association link and allows to modify properties on that new link. ( link => ... )
**query** (required) | instance of GraphQLQuery | iQuery GraphQL query to fetch the current list of target objects
value | string | Path to use as the representative value / id of the link
## &lt;AttachmentField/&gt;

Attachment form field allowing the user to upload attachments and remove attachments.

Storage of the attachments has to be done with the Attachments API.

### Props

 Name | Type | Description 
------|------|-------------
addons | array | Array of addons as props instead of as children. Only useful if you're writing a component wrapping Field and want to render your addons as field addons while using the render function form.
deleteRemoved | bool | If true, delete removed attachments from the database, otherwise just de-reference them. (default is true)
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
label | string | Label for the field.
labelClass | string | Additional HTML classes for the label element.
mode | FieldMode value | Mode for this field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for this field (e.g. "name", but also "foos.0.name")
tooltip | string | Tooltip / title attribute for the input element
## &lt;AttachmentLink/&gt;

Renders a link to an attachment

### Props

 Name | Type | Description 
------|------|-------------
attachment | object | An App_Attachment structure / observable
className | string | Additional HTML classes for the attachment link.
disabled | bool | True if the attachment link should be disabled
## &lt;DecimalField/&gt;



### Props

 Name | Type | Description 
------|------|-------------
addons | array | Array of addons as props instead of as children. Only useful if you're writing a component wrapping Field and want to render your addons as field addons while using the render function form.
autoFocus | bool | Pass-through autoFocus attribute for text inputs
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
inputClass | string | Additional HTML classes for the input element.
label | string | Label for the field.
labelClass | string | Additional HTML classes for the label element.
mode | FieldMode value | Mode for this field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for this field (e.g. "name", but also "foos.0.name")
onBlur | func | Optional blur handler to use
onChange | func | Optional change handler to use
placeholder | string | Placeholder text to render for text inputs.
precision | number | Numerical precision for big decimal fields. (e.g. 123.45 has a scale of 5)
scale | number | Numerical scale / number of fractional digits for big decimal fields
tooltip | string | Tooltip / title attribute for the input element
## &lt;URLField/&gt;



### Props

 Name | Type | Description 
------|------|-------------
addons | array | Array of addons as props instead of as children. Only useful if you're writing a component wrapping Field and want to render your addons as field addons while using the render function form.
autoFocus | bool | Pass-through autoFocus attribute for text inputs
formGroupClass | string | Additional HTML classes for the form group element.
helpText | string | Additional help text for this field. Is rendered for non-erroneous fields in place of the error.
inputClass | string | Additional HTML classes for the input element.
label | string | Label for the field.
labelClass | string | Additional HTML classes for the label element.
mode | FieldMode value | Mode for this field. If not set or set to null, the mode will be inherited from the &lt;Form/&gt; or &lt;FormBlock&gt;.
**name** (required) | string | Name / path for this field (e.g. "name", but also "foos.0.name")
onBlur | func | Optional blur handler to use
onChange | func | Optional change handler to use
placeholder | string | Placeholder text to render for text inputs.
tooltip | string | Tooltip / title attribute for the input element
