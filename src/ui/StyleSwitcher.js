import React, { useEffect, useState, useMemo } from "react"
import PropTypes from "prop-types"
import Cookies from "js-cookie"


import i18n from "../i18n"
import config from "../config"
import uri from "../uri"
import { findNamed } from "../util/type-utils";

const STYLE_LINK_ID = "automaton-style-link";

const PREFERRED_STYLE = "_AUTO_PREFERRED_STYLE";

function rememberStyle(style)
{
    Cookies.set(PREFERRED_STYLE, style, { expires: 365 });
}


function setActiveStyleSheet(style)
{
    const { alternateStyles } = config;
    if (!alternateStyles)
    {
        throw new Error("There are have no alternate styles");
    }

    const { styleSheets } = alternateStyles;

    const link = document.getElementById(STYLE_LINK_ID);
    const head = link.parentNode;

    const def = findNamed(styleSheets, style);
    if (!def)
    {
        throw new Error("No style '" + style +"' found");
    }
    const styleURI = uri(def.uri);
    const newLink = document.createElement("link");
    newLink.setAttribute("id", STYLE_LINK_ID);
    newLink.setAttribute("type", "text/css");
    newLink.setAttribute("rel", "stylesheet");
    newLink.setAttribute("href", styleURI);

    newLink.addEventListener(
        "load",
            ev => {
                head.removeChild(link);
        },
        true
    );
    head.appendChild(newLink);
}


function getDefaultStylesheet() {
    const { alternateStyles } = config;
    if (!alternateStyles)
    {
        throw new Error("There are have no alternate styles");
    }
    const style = Cookies.get(PREFERRED_STYLE);

    return style && findNamed(alternateStyles.styleSheets, style) !== null ? style : alternateStyles.currentStyleSheet;
}


const StyleSwitcher = ({onChange}) => {

    const { alternateStyles } = config;
    if (!alternateStyles)
    {
        // Don't offer a selection, we only have one style
        return false;
    }

    const [style, setStyle] = useState(getDefaultStylesheet);


    const { styleSheets } = alternateStyles;

    return (
        <div
            style={{
                display: "inline-block"
            }}
        >

            <div className="style-switcher-group form-group">
                <label className="sr-only" htmlFor="style-switcher-select">
                    {
                        i18n("Select Style")
                    }
                </label>
                <select
                    id="style-switcher-select"
                    className="form-control"
                    value={ style }
                    onChange={ ev => {
                        const style = ev.target.value;
                        setStyle(style);
                        setActiveStyleSheet(style);
                        if (onChange)
                        {
                            onChange(style);
                        }
                        else
                        {
                            rememberStyle(style);
                        }
                    } }
                >
                    {
                        styleSheets.map(
                            ({name}) => (
                                <option key={ name } value={ name }>
                                    {
                                        i18n(name)
                                    }
                                </option>
                            )
                        )
                    }
                </select>
            </div>
        </div>
    );
};

StyleSwitcher.getDefaultStylesheet = getDefaultStylesheet;
StyleSwitcher.setActiveStyleSheet = setActiveStyleSheet;
StyleSwitcher.rememberStyle = rememberStyle;

StyleSwitcher.propTypes = {
    /**
     * Optional change handler. If not set, the current selection is stored as cookie.
     */
    onChange: PropTypes.func
};

export default StyleSwitcher;
