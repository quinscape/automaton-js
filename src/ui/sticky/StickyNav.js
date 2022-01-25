import React, { useEffect, useRef, useContext } from "react";
import cx from "classnames";
import useWindowSize from "../../util/useWindowSize";

import {Navbar} from "reactstrap"
import StickySizesContext from "./StickySizesContext";
import useWindowScroll from "../../util/useWindowScroll";

/**
 * Create a Navbar, that is sticky and informs of its size changes.
 */
const StickyNav = ({
    id,
    expand,
    className,
    children
}) => {

    const stickySizes = useContext(StickySizesContext);
    const {width: windowWidth} = useWindowSize();
    const {scrollHeight} = useWindowScroll();
    const navbarRef = useRef();

    useEffect(() => {
        const navbarEl = navbarRef.current;
        if (navbarEl != null) {
            stickySizes.setHeaderHeight(navbarEl.offsetHeight);
        }
    }, [navbarRef.current, windowWidth, scrollHeight]);

    return (
        <div
            ref={ navbarRef }
            className="sticky-navbar-container"
        >
            <Navbar
                id={ id }
                expand={ expand }
                className={ cx(className, "sticky-navbar") }
            >
                { children }
            </Navbar>
        </div>
    )
};

export default StickyNav;
