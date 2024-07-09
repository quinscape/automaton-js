import React, { useEffect, useState } from "react"

const ItemMenuButton = ({idx, row, label, disabled, onClick,withSeparator,visible}) => {
    const [isDisabled, setDisabled] = useState(false);
    const [isVisible, setVisible] = useState(true);

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
        }else if (typeof disabled === "boolean") {
            setDisabled(disabled);
        }

        return () => {
            isRunning = false;
        }
    }, []);

    useEffect(() => {
        let isRunning = true;
        if (typeof visible === "function") {
            const result = visible(row);
            if (result instanceof Promise) {
                result.then((value) => {
                    if (isRunning) {
                        setVisible(value);
                    }
                })
            } else {
                setVisible(result);
            }

        }else if (typeof visible === "boolean") {
            setVisible(visible);
        }else {
            setVisible(true);
        }

        return () => {
            isRunning = false;
        }
    }, []);
    return (
        <div>
            {
                withSeparator && isVisible ? <hr className="dropdown-divider m-0 p-0"></hr> : <React.Fragment/>
            }
            <button
                type="button"
                tabIndex="0"
                role="menuitem"
                className="dropdown-item button-sm"
                data-idx={ idx }
                onClick={ onClick }
                disabled={ isDisabled }
                hidden={ !isVisible }
            >
            {
                typeof label === "function" ? label() : idx === 0 ? <b>{ label }</b> : label
            }
        </button>
    </div>
    )
}

export default ItemMenuButton;
