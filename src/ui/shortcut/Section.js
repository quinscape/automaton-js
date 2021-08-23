import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FormContext } from "domainql-form";
import {Card, CardBody, CardHeader} from "reactstrap";
import useAutomatonEnv from "../../useAutomatonEnv";

import PropTypes from "prop-types";

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
    scrollPaddingTop=15,
    children
}) => {

    const env = useAutomatonEnv();
    const shortcutState = useContext(ShortcutContext);

    useEffect(() => {
        shortcutState.setShortcut(id, heading, icon);
        return () => {
            shortcutState.removeShortcut(id);
        }
    }, [env.process.id]);
    
    return (
        <div style={ {position: "relative"} }>
            <div id={ id } style={ {position: "absolute", pointerEvents: "none", top: -scrollPaddingTop} } />
            <Card body>
                <CardHeader>
                    <h2>{ heading }</h2>
                </CardHeader>
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
     * the used FormContext
     * defaults to the default FormContext
     */
    formContext: PropTypes.instanceOf(FormContext)

}

export default Section
