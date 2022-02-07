import React, { useEffect, useRef, useContext } from "react";
import cx from "classnames";

import {Navbar} from "reactstrap"
import StickySizesContext from "./StickySizesContext";
import useResizeObserver from "../../util/useResizeObserver";

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
    const navbarRef = useRef();
    const {height: navbarHeight} = useResizeObserver(navbarRef);

    useEffect(() => {
        stickySizes.setHeaderHeight(navbarHeight);
    }, [navbarRef.current, navbarHeight]);

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
