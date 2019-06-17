import React from "react"
import PropTypes from "prop-types"
import cx from "classnames"
import { runProcessURI } from "../runProcess";


/**
 * Special automaton link that can do process changes within the current page context.
 *
 * You can use it like a normal link and if the URI patterns match, it will do its magic thing and otherwise
 * it will just be a link.
 */
const Link = props =>  {

    const onClick = ev => {

        const { href } = props;

        // we use the runProcessURI variant because we're starting out with a URI. (Not the runProcess variant that allows
        // process execution based on process name and processed input map).
        const promise = runProcessURI(href);
        if (!promise)
        {
            // wasn't a process URI, so we ignore it and let default handling handle it
            return;
        }

        // no default handling
        ev.preventDefault();
    };

    const { href, title, role, className, children } = props;

    return (
        <a
            className={
                cx("link-internal", className)
            }
            href={ href }
            onClick={ onClick }
            title={ title }
            role={ role }
        >
            {
                children
            }
        </a>
    )
};

Link.propTypes = {
    /**
     * Internal URI ( required )
     */
    href: PropTypes.string.isRequired,

    /**
     * Optional title attribute
     */
    title: PropTypes.string,
    /**
     * Optional role attribute
     */
    role: PropTypes.string,
    /**
     * Classes for the link element ( "link-internal" is added )
     */
    className: PropTypes.string
};


export default Link
