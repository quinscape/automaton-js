import React, { useEffect, useRef, useState } from "react"
import { Popper } from "react-popper";
import { Icon } from "domainql-form";
import ItemMenu from "./ItemMenu";
import { findParentLink, nextSelectionId } from "./Tree";


const ItemSubMenuWrapper = ({
    ctx,
    idx,
    selectionId,
    row,
    actions,
    label,
    disabled,
    onClick,
    withSeparator,
    visible
}) => {
    const isMenuOpen = ctx.menu.includes(selectionId);
    const [isDisabled, setDisabled] = useState(false);
    const [isVisible, setVisible] = useState(true);

    const buttonRef = useRef(null);

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
        <div
            onMouseEnter={() => ctx.pushMenu(selectionId)}
            onMouseLeave={() => ctx.popMenu()}
        >
            {
                withSeparator && isVisible ? <hr className="dropdown-divider m-0 p-0"></hr> : <React.Fragment />
            }
            <button
                ref={buttonRef}
                type="button"
                tabIndex="0"
                role="menuitem"
                className="dropdown-item button-sm"
                data-idx={idx}
                onClick={onClick}
                disabled={isDisabled}
                hidden={!isVisible}
            >
                <div className="d-flex">
                    {
                        typeof label === "function" ? label() : label
                    }
                    <Icon className="fa-angle-right p-1 ml-auto"/>
                </div>
            </button>
        {
            isMenuOpen && (
                <Popper
                    placement="right-start"
                    referenceElement={ buttonRef.current }
                    modifiers={ ctx.options.popperModifiers }
                    strategy="fixed"
                >
                    {({ref, style, placement, scheduleUpdate}) => (
                        <ItemMenu
                            ctx={ctx}
                            selectionId={selectionId}
                            ref={ ref }
                            style={ style }
                            data-placement={ placement }
                            scheduleUpdate={ scheduleUpdate }
                            close={ () => {
                                ctx.clearMenu();
                                const link = findParentLink(ctx.menuElem);
                                link && link.focus();
                            } }
                            row={ row }
                            actions={ actions }
                            isSubMenu
                        />
                    )}
                </Popper>
            )
        }
    </div>)
}

export default ItemSubMenuWrapper;
