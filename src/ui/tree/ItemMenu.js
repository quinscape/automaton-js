import React, { useContext, useEffect, useRef, useState } from "react"
import cx from "classnames"
import { MOVEMENT_KEYS, TreeContext } from "./Tree";
import ItemMenuButton from "./ItemMenuButton";


/**
 * Tree context menu.
 */
const ItemMenu = React.forwardRef(({style,placement,actions,scheduleUpdate,row, close}, ref) => {

    const [index, setIndex ] = useState(0);

    const innerRef = useRef(null);

    useEffect(
        () => {

            // select first item
            // autoFocus={true} or focus without preventScroll makes the browser jump to the top for some reason
            innerRef.current.querySelector(".dropdown-item").focus({preventScroll: true});

            const onClick = ev => {

                const menuElem = innerRef.current;
                //console.log("onClick", menuElem, ev.target);

                try
                {
                    if (!menuElem.contains(ev.target))
                    {
                        close();
                    }
                }
                catch(e)
                {
                    console.error(e);
                }
            };

            document.addEventListener("mousedown", onClick, true);

            return () => {
                document.removeEventListener("mousedown", onClick, true);
            }
        },
        []
    );

    const onKeyDown = ev => {

        const { keyCode } = ev;

        if (keyCode === 27)
        {
            close();
        }

        const buttons = innerRef.current.querySelectorAll("button");

        const n = MOVEMENT_KEYS[keyCode];
        if (n !== undefined)
        {
            ev.preventDefault();
            const newIndex = n === 0 ? 0 : n === Infinity ? buttons.length - 1 : index + n;
            if (newIndex >= 0 && newIndex < buttons.length)
            {
                buttons[newIndex].focus();
            }
        }

    };

    const onItemFocus = ev => setIndex(+ev.target.dataset.idx);
    return (
        <div
            ref={
                elem => {
                    innerRef.current = elem;
                    if (typeof ref === "function")
                    {
                        ref(elem);
                    }
                    else
                    {
                        ref.current = elem;
                    }
                }
            }
            style={ style }
            data-placement={ placement }
            onFocusCapture={ onItemFocus }
            onKeyDownCapture={ onKeyDown }
            className="dropdown-menu show"
            role="menu"
        >
            {
                actions.map(({label, action, disabled, withSeparator, visible},idx) => (
                    <ItemMenuButton
                        key={ idx }
                        idx={ idx }
                        label={ label }
                        row={ row }
                        disabled={ disabled }
                        onClick={
                            () => {
                                close();
                                action(row);
                            }
                        }
                        withSeparator={ withSeparator }
                        visible={ visible }
                    />
                ))
            }
        </div>
    );
});

export default ItemMenu;
