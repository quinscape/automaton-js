import React, {useContext, useMemo, useState} from "react"
import cx from "classnames"
import { TreeContext } from "./Tree";
import i18n from "../../i18n";
import {Icon} from "../../../../domainql-form";
import PropTypes from "prop-types";


/**
 * Internal helper component that renders the a11y friendly base tree item/<li>.
 *
 */
const TreeNode = React.forwardRef((props, ref) => {

    const {
        selectionId,
        renderer,
        renderCheckbox,
        initiallyCollapsed = true,
        children
    } = props;

    const ctx = useContext(TreeContext);

    const isSelected = ctx.selected === selectionId;
    const isDirectory = children && children.length > 0;

    const [collapsed, setCollapsed] = useState(initiallyCollapsed);

    return (
        <li
            ref={ ref }
            role="treeitem"
            tabIndex={ isSelected ? 0 : -1 }
            className={ cx("tree-node d-flex flex-column align-items-stretch", isSelected && "selected") }
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
            <div className="d-flex">
                {
                    isDirectory && (
                        <button
                            type="Button"
                            className="btn btn-link m-0 p-0 mr-2 px-2"
                            title={
                                i18n(collapsed ? "Expand" : "Collapse")
                            }
                            onClick={
                                () => {
                                    setCollapsed(!collapsed);
                                }
                            }
                        >
                            <Icon className={ cx(collapsed ? "fa-chevron-down" : "fa-chevron-up") }/>
                        </button>
                    )
                }
                <label className="d-flex align-content-center">
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
                        typeof renderer === "function" ? renderer(selectionId, {
                            isDirectory
                        }) : renderer ?? selectionId
                    }
                </label>
            </div>
            {
                isDirectory && !collapsed && (
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
