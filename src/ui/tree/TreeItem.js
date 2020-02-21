import React, { useContext, useMemo } from "react"
import cx from "classnames"
import { TreeContext } from "./Tree";


const TreeItem = React.forwardRef(({ selectionId, children }, ref) => {

    const ctx = useContext(TreeContext);

    const isSelected = ctx.selected === selectionId;
    return (
        <li
            ref={ ref }
            role="treeitem"
            tabIndex={ isSelected ? 0 : -1 }
            className={ cx("d-flex align-items-stretch", isSelected && "selected") }
            data-sel={ selectionId }
            onFocus={ev => {
                if (!isSelected)
                {
                    if (ev.target.tagName === "LI")
                    {
                        ctx.select(ev.target.dataset.sel);
                    }
                }
            }}
        >
            { children }
        </li>
    );
});

export default TreeItem;
