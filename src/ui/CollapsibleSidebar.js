import React, { useState, useEffect } from "react";
import { Resizable } from "re-resizable";
import {
    Icon
} from "domainql-form"
import cx from "classnames";
import {
    Col
} from "reactstrap"
import useWindowSize from "../util/useWindowSize";

/**
 * Create a Column, that can be expanded/collapsed.
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 * 
 * @param id
 * the id of the resulting html element
 * @param width
 * the initial width, that will be used if the device is at least a medum size device\
 * allowed units: px, vw, vh\
 * defualts to 200px
 * @param minWidth
 * the lower boundary that will be used for drag resizing\
 * allowed units: px, vw, vh\
 * defualts to 100px
 * @param maxWidth
 * the upper boundary that will be used for drag resizing\
 * allowed units: px, vw, vh\
 * defualts to 400px
 * @param collapsedLabelText
 * the text will be shown, if the element is collapsed
 * 
 * @constructor
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
        <Col
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
        </Col>
    )
};

export default CollapsibleSidebar;
