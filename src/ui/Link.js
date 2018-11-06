import React from "react"
import cx from "classnames"
import { runProcessURI } from "../runProcess";


/**
 * Special automaton link that can do process changes within the current page context.
 *
 * You can use it like a normal link and if the URI patterns match, it will do its magic thing and otherwise
 * it will just be a link.
 */
class Link extends React.Component {

    onClick = ev => {

        const { href } = this.props;

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


    render()
    {
        const {href, title, role, className, children} = this.props;

        return (
            <a
                className={
                    cx("link-internal", className)
                }
                href={href}
                onClick={this.onClick}
                title={title}
                role={role}
            >
                {
                    children
                }
            </a>
        )
    }
}


export default Link
