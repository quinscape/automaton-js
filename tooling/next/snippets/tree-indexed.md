
<section>
## &lt;Tree.IndexedObjects/&gt Example

IndexedObjects works very similar to Objects but it arranges the row
values in groups by initial character.

```js

<Tree
    id="animal-tree" aria-labelledby="animal-tree-title">
    <Tree.IndexedObjects
        values={ iQuery }
        index={ indexArray }
        render={(row, iSelected) => row.name }
        renderIndex={letter => (<b>{letter + ":"}</b>)}
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

It receives and addition `index` prop which must be provided with an
array of initial characters in sort order.

The optional `renderIndex` render prop is used to render the initial
letter tree group headers. Here we render it bold and add a colon.


</section>
