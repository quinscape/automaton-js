import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { Icon } from "domainql-form";
import { Card, CardBody, CardHeader } from "reactstrap";
import i18n from "../i18n";


const CollapsiblePanel = ({
    className,
    header,
    hideHeader,
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
                    title={expanded ? i18n("Collapse Panel") : i18n("Expand Panel")}
                    aria-expanded={expanded}
                >
                    <Icon className={expanded ? "fa-chevron-up" : "fa-chevron-down"} />
                </button>
                <span className={cx(hideHeader && "sr-only")}>
                    {
                        header
                    }
                </span>
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
    header: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element
    ]),
    /**
     * defines if the panel is initially collapsed or expanded
     */
    collapsed: PropTypes.bool
}

export default CollapsiblePanel;