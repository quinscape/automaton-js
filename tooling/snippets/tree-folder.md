## <Tree.Folder/> Example

```js

<Tree.Folder
    render={ () => "Folder Name" }
    query={ <graphql-query> }
    variables={ ... }
>
    {
        iQuery => (
            <Tree.Objects
                values={ iQuery }
                render={ row =>  row.name }
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
        )
    }
</Tree.Folder>
```

We can use <Tree.Objects/> or <Tree.IndexedObjects/> to render the
iQuery result.
