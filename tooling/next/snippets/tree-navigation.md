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
