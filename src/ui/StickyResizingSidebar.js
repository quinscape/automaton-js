import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Resizable } from "re-resizable";
import {
    Icon
} from "domainql-form"
import cx from "classnames";
import useWindowSize from "../util/useWindowSize";
import useWindowScroll from "../util/useWindowScroll";

/**
 * Create a Column, that is sticky and resizes inside its parameters.
 * 
 * This component is supposed to be used inside a flex layout (like bootstraps grid system)
 * 
 * @param id
 * the id of the resulting html element
 * @param scrollPaddingTop
 * the top padding to viewport in pixel to calculate size on scroll/resize\
 * defaults to 15
 * @param scrollPaddingBottom
 * the bottom padding to viewport in pixel to calculate size on scroll/resize\
 * defaults to 15
 * 
 * @constructor
 */
const StickyResizingSidebar = ({
    id,
    scrollPaddingTop = 15,
    scrollPaddingBottom = 30,
    className,
    style,
    children
}) => {

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
        // console.log(curTop, curBottom);
        if (curTop > 0 && curBottom > 0) {
            // console.log("1");
            const resH = cntH - curTop - curBottom;
            sidebarEl.style.height = `${resH}px`;
        } else if (curTop > 0) {
            // console.log("2");
            const resH = cntH - curTop;
            sidebarEl.style.height = `${resH}px`;
        } else if (curBottom > 0) {
            // console.log("3");
            const resH = cntH - curBottom;
            sidebarEl.style.height = `${resH}px`;
        } else {
            // console.log("4");
            sidebarEl.style.height = `${cntH}px`;
        }
    }

    useLayoutEffect(() => {
        const sidebarEl = sidebarRef.current;
        if (sidebarEl != null) {
            if (windowWidth >= 768) {
                if (scrollHeight != null) {
                    sidebarEl.style.top = `${scrollPaddingTop}px`;
                    sidebarEl.style.bottom = `${scrollPaddingTop}px`;
                    sidebarEl.style.height = "0px";
                    resizeElement(sidebarEl);
                }
            } else {
                sidebarEl.style.top = "";
                sidebarEl.style.bottom = "";
                sidebarEl.style.height = "";
            }
        }
    }, [sidebarRef.current, windowWidth, windowHeight]);

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
                ...style,
                top: `${scrollPaddingTop}px`,
                bottom: `${scrollPaddingBottom}px`
            }}
            id={id}
            className={ cx(className, "col", "sticky-resizing-sidebar") }
        >
            { children }
        </div>
    )
};

export default StickyResizingSidebar;
