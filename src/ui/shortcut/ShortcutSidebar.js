import React, {  useEffect, useContext } from "react";
import { observer as fnObserver } from "mobx-react-lite"
import cx from "classnames";
import PropTypes from "prop-types";

import StickyResizingSidebar from "../StickyResizingSidebar";
import ShortcutItem from "./ShortcutItem";
import ShortcutContext from "./ShortcutContext";

/**
 * Create a Column, that shows all form shortcuts from the surrounding context
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 */
 const ShortcutSidebar = fnObserver(({
    id,
    className
}) => {

    const shortcutState = useContext(ShortcutContext);

    return !!shortcutState.shortcuts.size && (
        <StickyResizingSidebar
            id={id}
            role="navigation"
            className={ cx(className, "shortcut-sidebar") }
        >
            <div className="wrapper">
                {
                    Array.from(shortcutState.shortcuts.values()).map(
                        ({id, icon, heading}) => {
                            return (
                                <ShortcutItem
                                    icon={ icon }
                                    reference={ id }
                                    heading={ heading }
                                    key={ id }
                                />
                            )
                        }
                    )
                }
            </div>
        </StickyResizingSidebar>
    )
});

export default ShortcutSidebar;
