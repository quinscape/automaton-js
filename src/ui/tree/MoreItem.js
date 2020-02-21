import React, { useContext, useMemo } from "react"
import cx from "classnames";
import TreeItem from "./TreeItem";
import i18n from "../../i18n";
import { nextSelectionId, TreeContext } from "./Tree";

const MoreItem = ({onClick}) => {

    const selectionId = useMemo( nextSelectionId, []);

    const ctx = useContext( TreeContext );

    return (
        <TreeItem
            selectionId={ selectionId }
            log={true}
        >
            <div className="gutter">

            </div>
            <div className="wrapper more">
                <div className={ cx("header", selectionId === ctx.selected && "focus") }>
                    <button
                        type="button"
                        className={ cx("btn btn-link default", ctx.options.small && "btn-sm" ) }
                        tabIndex={-1}
                        onClick={ onClick }
                    >
                        {
                            i18n("Tree:More")
                        }
                    </button>
                </div>
            </div>
        </TreeItem>
    );
};

export default MoreItem;
