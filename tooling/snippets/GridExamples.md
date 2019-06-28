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


