import React from "react";
import i18n from "../../i18n";
import {Icon} from "domainql-form";
import PropTypes from "prop-types";

const TokenListElement = (props) => {

    const {
        value,
        renderer,
        onRemoveTokenClick,
        disabled
    } = props;

    return (
        <li
            className="token-list-element d-flex justify-content-between align-items-center list-group-item"
        >
            <div
                className="token-list-element-text"
            >
                {
                    typeof renderer === "function" ? renderer(value) : value
                }
            </div>
            <button
                type="Button"
                className="btn btn-link m-0 p-0"
                title={
                    i18n("Remove")
                }
                onClick={
                    () => onRemoveTokenClick(value)
                }
                disabled={disabled}
            >
                <Icon className="fa-times"/>
            </button>
        </li>
    );
}

TokenListElement.propTypes = {
    /**
     * the value of the token
     */
    value: PropTypes.string,

    /**
     * optional rendering function used to display the token value
     */
    renderer: PropTypes.func,

    /**
     * callback function used for removing tokens
     */
    onRemoveTokenClick: PropTypes.func,

    /**
     * if this element is disabled or not
     */
    disabled: PropTypes.bool
}

export default TokenListElement;
