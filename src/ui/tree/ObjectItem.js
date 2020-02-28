import React, { useContext, useMemo, useRef, useState } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import { Icon } from "domainql-form";

import { findParentLink, nextSelectionId, TreeContext } from "./Tree";
import TreeItem from "./TreeItem";
import cx from "classnames";
import { Popper } from "react-popper";
import ItemMenu from "./ItemMenu";
import CaretButton from "./CaretButton";

/**
 * Internally reused component for individual items holding the open/collapsed state.
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
            {
                hasKids && (
                    <CaretButton
                        open={open}
                        onClick={ toggle }
                    />
                )
            }
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
                        onContextMenu={() => ctx.updateMenu(selectionId)}
                    >
                        {
                            render(row, isSelected)
                        }
                    </button>
                </div>
                {
                    actions.length > 1 && (
                        <React.Fragment>
                            <button
                                type="button"
                                className={ cx("btn btn-secondary item-menu ml-1 sr-only sr-only-focusable", ctx.options.small && "btn-sm") }
                                tabIndex={isSelected ? 0 : -1}
                                aria-haspopup={ true }
                                aria-expanded={ isMenuOpen }
                                onClick={() => ctx.updateMenu(selectionId)}
                            >
                                <Icon className="fa-angle-right p-1"/>
                            </button>
                            {
                                isMenuOpen && (
                                    <Popper
                                        placement="right-start"
                                        referenceElement={ ctx.menuElem }
                                        modifiers={ ctx.options.popperModifiers }
                                    >
                                        {({ref, style, placement, scheduleUpdate}) => (
                                            <ItemMenu
                                                ref={ ref }
                                                style={ style }
                                                data-placement={ placement }
                                                scheduleUpdate={ scheduleUpdate }
                                                close={ () => {
                                                    ctx.updateMenu(null);
                                                    const link = findParentLink(ctx.menuElem);
                                                    link && link.focus();
                                                } }

                                                row={ row }
                                                actions={ actions }
                                            />
                                        )}
                                    </Popper>
                                )
                            }
                        </React.Fragment>
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
