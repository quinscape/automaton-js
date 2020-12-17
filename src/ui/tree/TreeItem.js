import React, { useContext, useMemo } from "react"
import cx from "classnames"
import { TreeContext } from "./Tree";


/**
 * Internal helper component that renders the a11y friendly base tree item/<li>.
 *
 */
const TreeItem = React.forwardRef(({ selectionId, children, kind = "item" }, ref) => {

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
            data-kind={ kind }
        >
            { children }
        </li>
    );
});

export default TreeItem;
