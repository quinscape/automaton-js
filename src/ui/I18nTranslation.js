import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { observer as fnObserver } from "mobx-react-lite";
import config from "../config";
import i18n from "../i18n";

/**
 * Dynamic i18n component to "liveload" translation values
 */
const I18nTranslation = fnObserver((props) => {
    
    const { value, args = [], renderer } = props;

    const translation = useMemo(() => {
        return i18n(value, ...args);
    }, [config.translations, value, args]);

    if (typeof renderer === "function") {
        return renderer(translation);
    }

    return translation;
});

I18nTranslation.propTypes = {

    /**
     * translation tag/key
     */
    value: PropTypes.string.isRequired,

    /**
     * optional translation parameters
     */
    args: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),

    /**
     * optional renderer to modify the result by e.g. wrapping it in an "option"-element
     */
    renderer: PropTypes.func

};

export default I18nTranslation;
