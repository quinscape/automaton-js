import React from "react";
import i18n from "../../i18n";
import {Icon} from "domainql-form";

const TokenListElement = (props) => {

    const {
        value,
        renderer,
        removeToken,
        disabled
    } = props;

    return (
        <li
            className="token-list-element d-flex justify-content-between align-items-center"
        >
            {
                typeof renderer === "function" ? renderer(value) : value
            }
            <button
                type="Button"
                className="btn btn-link m-0 p-0"
                title={
                    i18n("Remove")
                }
                onClick={
                    () => removeToken(value)
                }
                disabled={disabled}
            >
                <Icon className="fa-times"/>
            </button>
        </li>
    );
}

export default TokenListElement;
