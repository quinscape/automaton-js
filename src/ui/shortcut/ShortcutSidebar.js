import React, {  useEffect, useContext } from "react";
import { observer as fnObserver } from "mobx-react-lite"
import cx from "classnames";
import PropTypes from "prop-types";

import StickyResizingSidebar from "../sticky/StickyResizingSidebar";
import ShortcutItem from "./ShortcutItem";
import ShortcutContext from "./ShortcutContext";

function isInNextSiblings(root, needle) {
    if (root == null || needle == null) {
        return false;
    }
    const nextEl = root.nextElementSibling;
    if (nextEl == null) {
        return false;
    }
    const found = nextEl.contains(needle);
    return found || isInNextSiblings(nextEl, needle);
}

function compareShortcutData(data0, data1) {
    const el0 = document.getElementById(data0.id);
    const el1 = document.getElementById(data1.id);
    return isInNextSiblings(el0.parentElement, el1) ? -1 : 1;
}

/**
 * Create a Column, that shows all form shortcuts from the surrounding context
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 */
 const ShortcutSidebar = fnObserver(({
    id,
    workingSet,
    className,
    children
}) => {

    const shortcutState = useContext(ShortcutContext);

    return (!!children || !!shortcutState.shortcuts.size) && (
        <StickyResizingSidebar
            id={id}
            role="navigation"
            className={ cx(className, "shortcut-sidebar") }
        >
            {
                !!children && (
                    <>
                        <div className="controls">
                            {
                                children
                            }
                        </div>
                    </>
                )
            }
            <div className="scroll-container">
                <div className="wrapper">
                    {
                        Array.from(shortcutState.shortcuts.values()).sort(compareShortcutData).map(
                            ({id, icon, heading}) => {
                                return (
                                    <ShortcutItem
                                        icon={ icon }
                                        reference={ id }
                                        heading={ heading }
                                        workingSet={ workingSet }
                                        key={ id }
                                    />
                                )
                            }
                        )
                    }
                </div>
            </div>
        </StickyResizingSidebar>
    )
});

export default ShortcutSidebar;
