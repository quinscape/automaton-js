import React, { useEffect } from "react";
import cx from "classnames";
import {
    Col
} from "reactstrap"

/**
 * 
 * @constructor
 */
const CollapsibleSidebar = ({
    id = "collapsible-sidebar", md, lg, xl,
    collapsedLabelText = "",
    className,
    children
}) => {

    const [expanded, setExpanded] = React.useState(false);
    const [expandLevel, setExpandLevel] = React.useState(0);
    const expandMoreBtnRef = React.useRef();
    const expandLessBtnRef = React.useRef();
    const firstRun = React.useRef(true);

    let mdSize, lgSize, xlSize, maxLevel = -1; 
    if (md != null) {
        if (!Array.isArray(md)) {
            md = [md];
        }
        mdSize = expandLevel >= 0 ? (expandLevel < md.length ? md[expandLevel] : md[md.length - 1]) : 0;
        maxLevel = maxLevel >= 0 ? Math.min(maxLevel, md.length - 1) : md.length - 1;
    }
    if (lg != null) {
        if (!Array.isArray(lg)) {
            lg = [lg];
        }
        lgSize = expandLevel >= 0 ? (expandLevel < lg.length ? lg[expandLevel] : lg[lg.length - 1]) : 0;
        maxLevel = maxLevel >= 0 ? Math.min(maxLevel, lg.length - 1) : lg.length - 1;
    }
    if (xl != null) {
        if (!Array.isArray(xl)) {
            xl = [xl];
        }
        xlSize = expandLevel >= 0 ? (expandLevel < xl.length ? xl[expandLevel] : xl[xl.length - 1]) : 0;
        maxLevel = maxLevel >= 0 ? Math.min(maxLevel, xl.length - 1) : xl.length - 1;
    }

    React.useEffect(() => {
        if (!firstRun.current) {
            if (!expanded) {
                expandMoreBtnRef.current.focus();
            } else if (expandLevel >= maxLevel) {
                expandLessBtnRef.current.focus();
            }
        } else {
            firstRun.current = false;
        }
    }, [expanded, expandLevel]);

    return (
        <Col
            id={id}
            md={mdSize}
            lg={lgSize}
            xl={xlSize}
            className={ cx(className, "collapsible-sidebar", expanded ? "expanded" : "collapsed") }
        >
            <div className="wrapper">
                <div className="label">
                    {collapsedLabelText}
                </div>
                <div className="content-wrapper">
                    {children}
                </div>
            </div>
            <div className="button-wrapper text-muted small">
                <button
                    type="button"
                    ref={expandLessBtnRef}
                    className={ cx("btn", "btn-primary", !expanded && "hidden") }
                    onClick={() => {
                        if (expandLevel > 0) {
                            setExpandLevel(expandLevel - 1);
                        } else if (expanded) {
                            setExpanded(false);
                        }
                    }}
                    aria-label={ expandLevel > 0 ? "Sidebar verkleinern" : "Sidebar einklappen" }
                >
                    <i className={ cx("fas", "fa-chevron-down") }></i>
                </button>
                <button
                    type="button"
                    ref={expandMoreBtnRef}
                    className={ cx("btn", "btn-primary", maxLevel < 0 || expanded && expandLevel >= maxLevel && "hidden") }
                    onClick={() => {
                        if (!expanded) {
                            setExpanded(true);
                        } else if (expandLevel < maxLevel) {
                            setExpandLevel(expandLevel + 1);
                        }
                    }}
                    aria-label={ expanded ? "Sidebar vergrößern" : "Sidebar ausklappen" }
                >
                    <i className={ cx("fas", "fa-chevron-up") }></i>
                </button>
            </div>
        </Col>
    )
};

export default CollapsibleSidebar;
