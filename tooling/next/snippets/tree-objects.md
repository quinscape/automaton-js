## &lt;Tree.Objects Example/&gt;

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

&lt;Tree.Objects/&gt; can have a render function child receiving the current
row object. The render function can render the descendant tree objects
for the row object.

The `actions` prop receives an array of action entries. The action
entries have a `label` and an `action` property. The `action` property
is a function receiving the row object for which the action was
triggered.

The first action is the default action which is triggered when the user
clicks on the name or presses return while the name is focused.
