import React, { useLayoutEffect, useRef, useContext } from "react";
import cx from "classnames";
import { observer as fnObserver } from "mobx-react-lite"
import StickySizesContext from "./StickySizesContext";
import useWindowSize from "../../util/useWindowSize";

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
    const {height: windowHeight} = useWindowSize();

    return (
        <div
            style={{
                ...style,
                top: `${stickySizes.headerHeight}px`,
                bottom: `${stickySizes.footerHeight}px`,
                height: `${windowHeight - (stickySizes.footerHeight + stickySizes.headerHeight)}px`
            }}
            id={id}
            className={ cx(className, "col", "sticky-resizing-sidebar") }
        >
            { children }
        </div>
    )
});

export default StickyResizingSidebar;
