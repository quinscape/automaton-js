import React, { useContext, useMemo, useRef, useState } from "react"
import { observer as fnObserver } from "mobx-react-lite"

import { nextSelectionId, TreeContext } from "./Tree";
import TreeItem from "./TreeItem";
import cx from "classnames";
import CaretButton from "./CaretButton";
import ItemMenuWrapper from "./ItemMenuWrapper";


/**
 * Renders a tree item based on a data row object.
 *
 * This is used in both <Tree.Objects/> and <Tree.IndexedObjects/>.
 */
const ObjectItem = fnObserver(({row, render, actions, index, renderKid}) => {

    const ref = useRef(null);

    const [ open, setOpen ] = useState(false);

    const selectionId = useMemo( nextSelectionId, []);

    const ctx = useContext( TreeContext );

    const hasKids = typeof renderKid === "function";

    const toggle = () => {
        const newState = !open;
        setOpen(newState);
        if (!newState)
        {
            ctx.reselectHidden(ref.current, selectionId);
        }
    };

    const isSelected = selectionId === ctx.selected;
    const isMenuOpen = ctx.menu === selectionId;
    return (
        <TreeItem
            ref={ ref }
            selectionId={ selectionId }
        >
            <CaretButton
                open={open}
                onClick={ toggle }
                invisible={!hasKids}
            />
            <div className="wrapper">
                <div className={ cx("header", isSelected && "focus") }>
                    <button
                        type="button"
                        className={ cx("btn btn-link default", ctx.options.small && "btn-sm" ) }
                        tabIndex={-1}
                        onClick={
                            ev => {

                                if (ev.ctrlKey || ev.shiftKey)
                                {
                                    ctx.updateMenu(selectionId);
                                }
                                else
                                {
                                    ctx.select(selectionId);
                                    actions[0].action(row);
                                }
                            }
                        }
                        onContextMenu={
                            ev => {
                                ctx.updateMenu(selectionId);
                                ev.preventDefault();
                            }
                        }
                    >
                        {
                            render(row, isSelected)
                        }
                    </button>
                </div>
                {
                    actions && actions.length > 1 && (
                        <ItemMenuWrapper
                            ctx={ctx}
                            selectionId={selectionId}
                            row={row}
                            actions={actions}
                        />
                    )
                }
                {
                    hasKids && open && (
                        <ul role="group">
                            {
                                renderKid(row)
                            }
                        </ul>
                    )
                }
            </div>
        </TreeItem>
    );
});

export default ObjectItem
