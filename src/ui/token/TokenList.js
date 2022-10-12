import React, {useEffect, useState} from "react";
import {Icon} from "domainql-form";
import {ButtonToolbar} from "reactstrap";
import i18n from "../../i18n";
import TokenListElement from "./TokenListElement";
import PropTypes from "prop-types";
import cx from "classnames";

const TokenList = (props) => {

    const {
        tokens,
        renderer,
        buttonRenderer,
        disabled,
        isCompact,
        onChange,
        onEdit
    } = props;

    const [tokenList, setTokenList] = useState(tokens);

    useEffect(() => {
        setTokenList(tokens);
    }, [tokens]);

    let button;
    if (typeof buttonRenderer === "function") {
        button = buttonRenderer();
    } else {
        button = (
            <>
                <Icon className="fa-edit mr-1"/>
                {
                    i18n("Edit")
                }
            </>
        );
    }

    return (
        <div
            className={cx("token-list-container", isCompact && "compact")}
        >
            <ul
                className={cx("token-list list-group", isCompact && "border rounded-left")}
            >
                {
                    isCompact && tokenList.length > 1 ?
                    i18n("{0} Elements", tokenList.length) : 
                    tokenList.map((value,idx) => {

                        return (
                            <TokenListElement
                                key={idx}
                                value={value}
                                disabled={disabled}
                                renderer={renderer}
                                onRemoveTokenClick={(value) => {
                                    if (tokenList.includes(value)) {
                                        const index = tokenList.indexOf(value);
                                        const newTokenList = [
                                            ... tokenList.slice(0, index),
                                            ... tokenList.slice(index + 1)
                                        ];

                                        setTokenList(newTokenList);
                                        onChange(newTokenList);
                                    }
                                }}
                            />
                        );
                    })
                }
            </ul>
            <ButtonToolbar
                className={cx(!isCompact && "mt-2")}
            >
                <button
                    type="Button"
                    className="btn btn-light btn-token-edit"
                    onClick={ onEdit }
                    disabled={disabled}
                >
                    {
                        button
                    }
                </button>
            </ButtonToolbar>
        </div>
    );
}

TokenList.propTypes = {
    /**
     * the tokens displayed in the list
     */
    tokens: PropTypes.arrayOf(PropTypes.string),

    /**
     * rendering function for rendering the list elements
     */
    renderer: PropTypes.func,

    /**
     * if this module is disabled
     */
    disabled: PropTypes.bool,

    /**
     * callback function called on changes to the token list
     */
    onChange: PropTypes.func,

    /**
     * callback function called on edit button click
     */
    onEdit: PropTypes.func
}

export default TokenList;
