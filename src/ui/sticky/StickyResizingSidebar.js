import React, { useLayoutEffect, useRef, useContext } from "react";
import cx from "classnames";
import { observer as fnObserver } from "mobx-react-lite"
import StickySizesContext from "./StickySizesContext";

/**
 * Create a Column, that is sticky and resizes inside its parameters.
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 */
const StickyResizingSidebar = fnObserver(({
    id,
    className,
    style,
    children
}) => {

    const stickySizes = useContext(StickySizesContext);
    const sidebarRef = useRef();

    useLayoutEffect(() => {
        const sidebarEl = sidebarRef.current;
        if (sidebarEl != null) {
            if (window.innerWidth >= 768) {
                const cntH = window.innerHeight - (stickySizes.footerHeight + stickySizes.headerHeight);
                sidebarEl.style.height = `${cntH}px`;
            } else {
                sidebarEl.style.top = "";
            }
        }
    }, [sidebarRef.current, stickySizes.headerHeight]);

    return (
        <div
            ref={sidebarRef}
            style={{
                ...style,
                top: `${stickySizes.headerHeight}px`,
                bottom: `${stickySizes.footerHeight}px`
            }}
            id={id}
            className={ cx(className, "col", "sticky-resizing-sidebar") }
        >
            { children }
        </div>
    )
});

export default StickyResizingSidebar;
