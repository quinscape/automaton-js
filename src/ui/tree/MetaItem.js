import React, { useContext } from "react";
import cx from "classnames";
import { TreeContext } from "./Tree";


/**
 * Not selectable meta-item within the tree (e.g. displaying a loading indicator, a no-results element)
 * @constructor
 */
const MetaItem = ({ children }) => {

    const ctx = useContext( TreeContext );

    return (
        <li className="meta-item" role="treeitem">
            <div className="wrapper">
                <div className={ cx("header text-muted", ctx.options.small && "small")}>
                    {
                        children
                    }
                </div>
            </div>
        </li>
    )
};

export default MetaItem;
