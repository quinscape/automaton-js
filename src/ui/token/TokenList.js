import React, {useEffect, useState} from "react";
import {Icon} from "domainql-form";
import {ButtonToolbar} from "reactstrap";
import i18n from "../../i18n";
import TokenListElement from "./TokenListElement";

const TokenList = (props) => {

    const {
        tokens,
        renderer,
        disabled,
        onChange,
        onEdit
    } = props;

    const [tokenList, setTokenList] = useState(tokens);

    useEffect(() => {
        setTokenList(tokens);
    }, [tokens]);

    return (
        <>
            <ul
                className="token-list"
            >
                {
                    tokenList.map((value,idx) => {

                        return (
                            <TokenListElement
                                key={idx}
                                value={value}
                                disabled={disabled}
                                renderer={renderer}
                                removeToken={(value) => {
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
            <ButtonToolbar>
                <button
                    type="Button"
                    className="btn btn-light"
                    onClick={ onEdit }
                    disabled={disabled}
                >
                    <Icon className="fa-edit mr-1"/>
                    {
                        i18n("Edit")
                    }
                </button>
            </ButtonToolbar>
        </>
    )
}

export default TokenList;
