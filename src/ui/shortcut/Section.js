import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import cx from "classnames";
import { FormContext } from "domainql-form";
import {Card, CardBody, CardHeader} from "reactstrap";
import PropTypes from "prop-types";

import useAutomatonEnv from "../../useAutomatonEnv";
import config from "../../config";
import ShortcutContext from "./ShortcutContext";

/**
 * Create a form section
 * 
 * This component registers the section to the shortcut context
 * 
 */
const Section = ({
    id,
    icon,
    heading,
    headingRenderer,
    hideHeader,
    children
}) => {

    const scrollPaddingTop = config.ui.stickyTopPadding;

    const env = useAutomatonEnv();
    const shortcutState = useContext(ShortcutContext);

    useEffect(() => {
        shortcutState.setShortcut(id, heading, icon);
        return () => {
            shortcutState.removeShortcut(id);
        }
    }, [env.process.id]);

    const headerContent = typeof headingRenderer == "function" ? headingRenderer(heading) : (
        typeof headingRenderer == "string" ? headingRenderer : (
            <h2>{ heading }</h2>
        )
    );
    
    return (
        <div style={ {position: "relative"} }>
            <div id={ id } style={ {position: "absolute", pointerEvents: "none", top: -scrollPaddingTop} } />
            <Card body>
                {
                    headerContent ? (
                        <CardHeader className={ cx(hideHeader && "sr-only") }>
                        {
                            headerContent
                        }
                        </CardHeader>
                    ) : ""
                }
                <CardBody>
                    { children }
                </CardBody>
            </Card>
        </div>
    );
};

Section.propTypes = {
    /**
     * the id of the resulting html element
     */
    id: PropTypes.string.isRequired,
    /**
     * the icon used for the shortcut link
     * 
     * can either be a fontawesome key or a render function
     */
    icon: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]).isRequired,
    /**
     * the header of the section and also the tooltip of the shortcut link
     */
    heading: PropTypes.string.isRequired,
    /**
     * defines how the header of the section is rendered, default is a render as h2
     */
    headingRenderer: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),
    /**
     * if set to true, the card header will be set to be visible for screenreaders only
     */
    hideHeader: PropTypes.bool,
    /**
     * the used FormContext
     * defaults to the default FormContext
     */
    formContext: PropTypes.instanceOf(FormContext)

}

export default Section
