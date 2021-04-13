
<section>
## &lt;Tree.Folder/&gt Example

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

We can use &lt;Tree.Objects/&gt or &lt;Tree.IndexedObjects/&gt to render the
iQuery result.

</section>
