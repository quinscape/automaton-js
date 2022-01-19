import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Icon } from "domainql-form";
import { Card, CardBody, CardHeader } from "reactstrap";


const CollapsiblePanel = ({
    className,
    header,
    collapsed,
    children
}) => {
    const [expanded, setExpanded] = useState(!collapsed);

    return(
        <Card className={cx("collapsible-panel", className, expanded ? "expanded" : "collapsed")} body>
            <CardHeader>
                <button
                    type="button"
                    className={ cx("btn", "btn-outline-primary", "collapse-button") }
                    onClick={() => {
                        setExpanded(!expanded);
                    }}
                    aria-expanded={expanded}
                >
                    <Icon className={expanded ? "fa-chevron-up" : "fa-chevron-down"} />
                </button>
                {
                    header
                }
            </CardHeader>
            <CardBody>
                {
                    children
                }
            </CardBody>
        </Card>
    )
}

CollapsiblePanel.propTypes = {
    /**
     * the header of the section and also the tooltip of the shortcut link
     */
    header: PropTypes.string,
    /**
     * defines if the panel is initially collapsed or expanded
     */
    collapsed: PropTypes.bool
}

export default CollapsiblePanel;