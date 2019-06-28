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
