import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import cx from "classnames";
import { FormContext } from "domainql-form";
import {Card, CardBody, CardHeader} from "reactstrap";
import PropTypes from "prop-types";
import { observer as fnObserver } from "mobx-react-lite"

import useAutomatonEnv from "../../useAutomatonEnv";
import config from "../../config";
import ShortcutContext from "./ShortcutContext";
import CollapsiblePanel from "../CollapsiblePanel";
import StickySizesContext from "../sticky/StickySizesContext";

/**
 * Create a form section
 * 
 * This component registers the section to the shortcut context
 * 
 */
const Section = fnObserver(({
    id,
    icon,
    heading,
    headingRenderer,
    hideHeader,
    collapsible,
    initiallyCollapsed,
    children
}) => {

    const stickySizes = useContext(StickySizesContext);

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
            <div id={ id } style={ {position: "absolute", pointerEvents: "none", top: -stickySizes.headerHeight} } />
            {
                collapsible ? (
                    <CollapsiblePanel header={headerContent} hideHeader={hideHeader} collapsed={initiallyCollapsed}>
                        {
                            children
                        }
                    </CollapsiblePanel>
                ) : (
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
                            {
                                children
                            }
                        </CardBody>
                    </Card>
                )
            }
        </div>
    );
});

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
    formContext: PropTypes.instanceOf(FormContext),
    /**
     * defines if this section is collapsible or not
     */
    collapsible: PropTypes.bool,
    /**
     * if the section is collapsible, defines if it is initially collapsed or not
     * has no effect if the section is not collapsible
     */
    initiallyCollapsed: PropTypes.bool
}

export default Section
