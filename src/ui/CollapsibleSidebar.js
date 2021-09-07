import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import {
    Icon
} from "domainql-form"
import cx from "classnames";
import PropTypes from "prop-types";

import StickyResizingSidebar from "./StickyResizingSidebar";
import useWindowSize from "../util/useWindowSize";

/**
 * Create a Column, that can be expanded/collapsed.
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 */
const CollapsibleSidebar = ({
    id,
    width = "200px",
    minWidth = "100px",
    maxWidth = "400px",
    collapsedLabelText = "",
    className,
    children
}) => {

    const [expanded, setExpanded] = useState(false);
    const {width: windowWidth} = useWindowSize();

    return (
        <StickyResizingSidebar
            id={id}
            className={ cx(className, "collapsible-sidebar", expanded > 0 ? "expanded" : "collapsed") }
        >
            <div className="button-wrapper text-muted small">
                <button
                    type="button"
                    className={ cx("btn", "btn-secondary", "collapse-button") }
                    onClick={() => {
                        setExpanded(!expanded);
                    }}
                    aria-label={ expanded ? "Sidebar einklappen" : "Sidebar ausklappen" }
                >
                    <Icon className="fa-chevron-down" />
                </button>
            </div>
            <div className="wrapper">
                <Resizable
                    className="resizer"
                    defaultSize={{
                        width: width,
                        height: "100%"
                    }}
                    minWidth={minWidth}
                    maxWidth={maxWidth}
                    enable={{
                        top: false,
                        right: windowWidth >= 768,
                        bottom: false,
                        left: false,
                        topRight: false,
                        bottomRight: false,
                        bottomLeft: false,
                        topLeft: false
                    }}
                >
                    <div className="content-wrapper">
                        {children}
                    </div>
                </Resizable>
            </div>
            <div className="label">
                {collapsedLabelText}
            </div>
        </StickyResizingSidebar>
    )
};

CollapsibleSidebar.propTypes = {
    /**
     * The text shown, if the element is collapsed
     */
    collapsedLabelText: PropTypes.string,
    /**
     * the upper boundary that will be used for drag resizing\
     * allowed units: px, vw, vh\
     * defaults to 400px
     */
    maxWidth: PropTypes.string,
    /**
     * the lower boundary that will be used for drag resizing\
     * allowed units: px, vw, vh\
     * defaults to 100px
     */
    minWidth: PropTypes.string,
    /**
     * the initial width, that will be used if the device is at least a medum size device\
     * allowed units: px, vw, vh\
     * defaults to 200px
     */
    width: PropTypes.string
}

export default CollapsibleSidebar;
