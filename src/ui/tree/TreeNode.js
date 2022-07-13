import React, { useContext, useMemo } from "react"
import cx from "classnames"
import { TreeContext } from "./Tree";


/**
 * Internal helper component that renders the a11y friendly base tree item/<li>.
 *
 */
const TreeNode = React.forwardRef((props, ref) => {

    const {
        selectionId,
        renderer,
        renderCheckbox,
        children
    } = props;

    const ctx = useContext(TreeContext);

    const isSelected = ctx.selected === selectionId;
    return (
        <li
            ref={ ref }
            role="treeitem"
            tabIndex={ isSelected ? 0 : -1 }
            className={ cx("d-flex flex-column align-items-stretch", isSelected && "selected") }
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

            <label className="d-flex">
                {
                    renderCheckbox && (!children || children.length < 1) && (
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={ctx.selectionList.includes(selectionId)}
                            onChange={(event) => {
                                if (event.target.checked) {
                                    ctx.checkItem(selectionId);
                                } else {
                                    ctx.uncheckItem(selectionId);
                                }
                            }}
                        />
                    )
                }
                {
                    typeof renderer === "function" ? renderer() : renderer
                }
            </label>
            {
                children && children.length > 0 && (
                    <ul className="d-block ml-4">
                        {
                            children
                        }
                    </ul>
                )
            }
        </li>
    );
});

export default TreeNode;
