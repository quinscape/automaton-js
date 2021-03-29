import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import {
    Icon
} from "domainql-form"
import cx from "classnames";
import useWindowSize from "../util/useWindowSize";
import useWindowScroll from "../util/useWindowScroll";

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
 * defaults to 200px
 * @param minWidth
 * the lower boundary that will be used for drag resizing\
 * allowed units: px, vw, vh\
 * defaults to 100px
 * @param maxWidth
 * the upper boundary that will be used for drag resizing\
 * allowed units: px, vw, vh\
 * defaults to 400px
 * @param collapsedLabelText
 * the text will be shown, if the element is collapsed
 * @param scrollPaddingTop
 * the top padding to viewport in pixel to calculate size on scroll/resize\
 * defaults to 15
 * @param scrollPaddingBottom
 * the bottom padding to viewport in pixel to calculate size on scroll/resize\
 * defaults to 15
 * 
 * @constructor
 */
const CollapsibleSidebar = ({
    id,
    width = "200px",
    minWidth = "100px",
    maxWidth = "400px",
    collapsedLabelText = "",
    scrollPaddingTop = 15,
    scrollPaddingBottom = 30,
    className,
    children
}) => {

    const [expanded, setExpanded] = useState(false);
    const {width: windowWidth, height: windowHeight} = useWindowSize();
    const {scrollY, scrollHeight} = useWindowScroll();
    const sidebarRef = useRef();

    function resizeElement(sidebarEl) {
        const cntH = windowHeight - (scrollPaddingBottom + scrollPaddingTop);
        const parentEl = sidebarEl.parentElement;
        const rect = parentEl.getBoundingClientRect();
        const curTop = rect.top - scrollPaddingTop;
        const curBottom = cntH - (rect.bottom - scrollPaddingTop);
        /* --- */
        console.log(curTop, curBottom);
        if (curTop > 0 && curBottom > 0) {
            console.log("1");
            const resH = cntH - curTop - curBottom;
            sidebarEl.style.height = `${resH}px`;
        } else if (curTop > 0) {
            console.log("2");
            const resH = cntH - curTop;
            sidebarEl.style.height = `${resH}px`;
        } else if (curBottom > 0) {
            console.log("3");
            const resH = cntH - curBottom;
            sidebarEl.style.height = `${resH}px`;
        } else {
            console.log("4");
            sidebarEl.style.height = `${cntH}px`;
        }
    }

    useLayoutEffect(() => {
        const sidebarEl = sidebarRef.current;
        if (sidebarEl != null) {
            if (windowWidth >= 768) {
                if (scrollHeight != null) {
                    sidebarEl.style.top = scrollPaddingTop;
                    sidebarEl.style.bottom = scrollPaddingTop;
                    sidebarEl.style.height = `${0}px`;
                    resizeElement(sidebarEl);
                }
            } else {
                sidebarEl.style.top = "";
                sidebarEl.style.bottom = "";
                sidebarEl.style.height = "";
            }
        }
    }, [windowWidth, windowHeight]);

    useLayoutEffect(() => {
        if (windowWidth >= 768) {
            const sidebarEl = sidebarRef.current;
            if (sidebarEl != null) {
                resizeElement(sidebarEl);
            }
        }
    }, [scrollY]);

    return (
        <div
            ref={sidebarRef}
            style={{
                top: `${scrollPaddingTop}px`,
                bottom: `${scrollPaddingBottom}px`
            }}
            id={id}
            className={ cx(className, "col", "collapsible-sidebar", expanded > 0 ? "expanded" : "collapsed") }
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
        </div>
    )
};

export default CollapsibleSidebar;
