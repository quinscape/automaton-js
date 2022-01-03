import React, { useEffect, useState } from "react"

const ItemMenuButton = ({idx, row, label, disabled, onClick}) => {
    const [isDisabled, setDisabled] = useState(true);
    useEffect(() => {
        let isRunning = true;

        if (typeof disabled === "function") {
            const result = disabled(row);
            if (result instanceof Promise) {
                result.then((value) => {
                    if (isRunning) {
                        setDisabled(value);
                    }
                })
            } else {
                setDisabled(result);
            }
        }

        return () => {
            isRunning = false;
        }
    }, []);
    return (
        <button
            key={ idx }
            type="button"
            tabIndex="0"
            role="menuitem"
            className="dropdown-item button-sm"
            data-idx={ idx }
            onClick={ onClick }
            disabled={ isDisabled }
        >
            {
                typeof label === "function" ? label() : idx === 0 ? <b>{ label }</b> : label
            }
        </button>
    )
}

export default ItemMenuButton;
