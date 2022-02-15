import React, { useContext, useMemo, useRef, useState } from "react";
import { nextSelectionId, TreeContext } from "./Tree";
import TreeItem from "./TreeItem";
import CaretButton from "./CaretButton";
import cx from "classnames";
import i18n from "../../i18n";
import ItemMenuWrapper from "./ItemMenuWrapper";


const defaultAltText = letter => i18n("Toggle Items starting with {0}", letter);

const IndexItem = ({ row, letter, open, setOpen, render, altText = defaultAltText, heading, headingActions, children }) => {

    const ctx = useContext(TreeContext);

    const ref = useRef(null);

    // selection id for the index item itself
    const selectionId = useMemo(nextSelectionId, []);

    // open/close state for the index item itself
    const toggle = () => {
        const newState = !open;
        setOpen(newState);
        if (!newState)
        {
            ctx.reselectHidden(ref.current, selectionId);
        }
    };

    // selection id for the optional intermediary heading
    const headingSelectionId = useMemo(nextSelectionId, []);

    // open/close state for the intermediary heading
    const [ headingOpen, setHeadingOpen ] = useState(true);
    const toggleHeading = () => setHeadingOpen(!headingOpen);

    let innerElements;

    if (heading)
    {
        innerElements = (
            <TreeItem
                selectionId={ headingSelectionId }
            >
                <CaretButton
                    open={ headingOpen }
                    onClick={
                        toggleHeading
                    }
                />
                <div className="wrapper">
                    <div className={
                        cx(
                            "header",
                            headingSelectionId === ctx.selected && "focus"
                        )
                    }>
                        <button
                            type="button"
                            className={
                                cx(
                                    "btn btn-link default",
                                    ctx.options.small && "btn-sm"
                                )
                            }
                            tabIndex={ -1 }
                            onClick={
                                toggleHeading
                            }
                            onContextMenu={
                                ev => {
                                    ctx.updateMenu(headingSelectionId);
                                    ev.preventDefault();
                                }
                            }
                        >
                            {
                                heading
                            }
                        </button>
                    </div>
                    {
                        headingActions && headingActions.length > 1 && (
                            <ItemMenuWrapper
                                ctx={ctx}
                                selectionId={headingSelectionId}
                                row={row}
                                actions={headingActions}
                            />
                        )
                    }
                    {
                        headingOpen && (
                            <ul role="group">
                                {
                                    children
                                }
                            </ul>
                        )
                    }
                </div>
            </TreeItem>
        )
    }
    else
    {
        innerElements = (
            children
        );
    }


    return (
        <TreeItem
            ref={ ref }
            selectionId={ selectionId }
        >
            <CaretButton
                open={ open }
                onClick={
                    toggle
                }
            />
            <div className="wrapper">
                <div className={
                    cx(
                        "header",
                        selectionId === ctx.selected && "focus"
                    )
                }
                >
                    <button
                        type="button"
                        className={
                            cx(
                                "btn btn-link default",
                                ctx.options.small && "btn-sm"
                            )
                        }
                        tabIndex={ -1 }
                        onClick={
                            toggle
                        }
                    >
                        {
                            render(letter)
                        }
                    </button>
                </div>
                {
                    open && (
                        <ul role="group">
                            {
                                innerElements
                            }
                        </ul>
                    )
                }
            </div>
        </TreeItem>
    );
};

export default IndexItem;
