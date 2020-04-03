import React, { useEffect, useMemo, useReducer, useRef } from "react"
import PropTypes from "prop-types"
import { Manager } from "react-popper";
import { action } from "mobx";
import Objects from "./Objects";
import get from "lodash.get";
import IndexedObjects from "./IndexedObjects";
import Folder from "./Folder";
import MetaItem from "./MetaItem";


export const TreeContext = React.createContext({
    id: "tree-widget"
});

let selectionCounter = 1;

export function nextSelectionId()
{
    return "i-" + selectionCounter++;
}

function findTreeItems(root)
{
    return root.querySelectorAll("li[role='treeitem']");
}


/**
 * Mobx action that inserts / appends newly loaded data rows.
 */
export const appendRows = action(
    "Tree.appendRows",
    (values, newValues, nameField = "name", pos = -1) => {

        //console.log({values, newValues, nameField, pos})

        values.queryConfig = newValues.queryConfig;

        if (pos === -1)
        {
            values.rows.push(... newValues.rows);
        }
        else
        {

            const { rows: existingRows } = values;
            const { rows: newRows } = newValues;

            const newArray = existingRows.slice(0, pos);

            for (let i = 0; i < newRows.length; i++)
            {
                const newRow = newRows[i];

                const newName = get(newRow, nameField);

                let found = false;
                for (let j = pos ; j < existingRows.length; j++)
                {
                    const existingRow = existingRows[j];

                    const name = get(existingRow, nameField);

                    if (name === newName)
                    {
                        // console.log("Name ", name, " already present in list at ", j);

                        // update row with fresher values
                        existingRow[j] = newRow;
                        found = true;
                        break;
                    }
                }

                if (!found)
                {
                    newArray.push(newRow);
                }
            }

            newArray.push(... existingRows.slice(pos));

            values.rows.replace(newArray);
        }
    }
);


function findItemIndex(items, selectionId)
{
    for (let i = 0; i < items.length; i++)
    {
        const item = items[i];
        if (item.dataset.sel === selectionId)
        {
            return i;
        }
    }
    return -1;
}

export const MOVEMENT_KEYS = {
    36: 0,
    35: Infinity,
    40: 1,
    38: -1
};

const SELECT = "SELECT";
const MENU = "MENU";

function reducer(state,action)
{
    let newState;
    switch (action.type)
    {
        case SELECT:
        {
            const { selectionId } = action;

            newState = {
                ... state,
                selected: selectionId
            };
            break;
        }

        case MENU:
        {
            const { selectionId } = action;

            newState = {
                ... state,
                menu: selectionId
            };
            if (selectionId)
            {
                newState.selected = selectionId;
            }
            break;
        }

    }

    //console.log("Tree reducer", state, action, "\n  =>", newState);

    return newState;
}

const DEFAULT_STATE = {
    /** Currently selected selection id string or null */
    selected: null,
    /** Selection-id for which the context-menu is rendered */
    menu: null
};


export function findParentLink(target)
{
    let current = target.parentNode;
    while (current)
    {
        if (current.tagName === "LI")
        {
            return current;
        }

        current = current.parentNode;
    }
    return null;
}


const DEFAULT_OPTIONS = {
    /**
     * Default Popper modifiers config
     */
    popperModifiers: {
        preventOverflow: {
            enabled: true,
            boundariesElement: "viewport"
        }
    },
    small: false
};

/**
 * Root tree component.
 */
const Tree = ({id = "tree", "aria-labelledby" : labelledBy, options, children}) => {

    const treeRef = useRef(null);

    /** Tree state */
    const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

    /** Memoized Tree ctx */
    const ctx = useMemo(
        () =>
            ({
                id,
                ...state,

                menuElem: document.querySelector(`li[data-sel='${state.menu}'] .default`),

                options: {
                    ... DEFAULT_OPTIONS,
                    ... options
                },

                select: selectionId => {
                    if (state.selected !== selectionId)
                    {
                        dispatch(
                            {
                                type: SELECT,
                                selectionId
                            }
                        );
                    }
                },

                updateMenu: selectionId => {
                    dispatch(
                        {
                            type: MENU,
                            selectionId
                        }
                    );
                },

                reselectHidden: (container, selectionId) => {

                    const current = container.querySelector(`[data-sel='${state.selected}']`);
                    if (current && current.dataset.sel !== selectionId)
                    {
                        //console.log("reselectHidden", selectionId);
                        dispatch({type: SELECT, selectionId})
                    }
                },

                findSelectionIndex: selectionId => {
                    const items = findTreeItems(treeRef.current);
                    return findItemIndex(items,selectionId);
                },

                selectByIndex: index => {
                    const items = findTreeItems(treeRef.current);

                    if (index <0 || index >= items.length)
                    {
                        throw new Error(`Invalid tree item index: ${index}`)
                    }

                    items[index].focus();
                },

                selectFirst: () => {
                    const firstItem = treeRef.current.querySelector("li[role='treeitem']");
                    if (firstItem)
                    {
                        const firstId = firstItem.dataset.sel;
                        //console.log(`Select first id '${firstId}'`);
                        ctx.select(firstId);
                    }
                }


            }),
        [ id, state ]
    );

    useEffect(
        () => {
            if (state.selected === null)
            {
                ctx.selectFirst();
            }
        },
        []
    );


    const onKeyDown = ev => {

        const { selected } = state;
        const { keyCode, target }= ev;

        const  { classList } = ev.target;

        // we activate the meta menu when any of the modifier keys is held or if the current focus is on
        // the sr-only button.item-menu
        const meta  = ev.ctrlKey || ev.altKey || ev.shiftKey || classList.contains("item-menu");

        // ignore keys within the context-menu
        if (classList.contains("dropdown-item"))
        {
            return;
        }

        //console.log("Tree.onKeyDown", { target, keyCode});

        switch(keyCode)
        {
            case 13: // return
            {
                if (meta)
                {
                    const button = treeRef.current.querySelector(`li[data-sel='${selected}'] .item-menu`);
                    const link = findParentLink(button);
                    if (
                        button &&
                        // make sure the menu is a direct descendant
                        link.dataset.sel === selected
                    )
                    {
                        //button.focus();
                        button.click();
                        ev.preventDefault();
                    }
                }
                else
                {
                    const button = treeRef.current.querySelector(`li[data-sel='${selected}'] .default`);
                    if (button)
                    {
                        button.click();
                        ev.preventDefault();
                    }
                }
                break;
            }
            case 37:    // cursor left
            {
                const button = target.querySelector("button.caret");
                if (button && button.getAttribute("aria-expanded") === "true")
                {
                    button.click();
                }
                else
                {
                    const parentItem = findParentLink(target);
                    if (parentItem)
                    {
                        parentItem.focus();
                    }
                }
                break;
            }
            case 39: // cursor right
            {
                const button = target.querySelector("button.caret");
                if (button && button.getAttribute("aria-expanded") === "false")
                {
                    button.click();
                }
                else
                {
                    const firstChild = target.querySelector("li");
                    if (firstChild)
                    {
                        firstChild.focus();
                    }
                }
                break;
            }

            default:
            {
                const n = MOVEMENT_KEYS[keyCode];
                //console.log("movement[", keyCode, "] = ", n);
                if (n !== undefined)
                {
                    ev.preventDefault();

                    const items = findTreeItems(treeRef.current);
                    let pos = findItemIndex(items, selected);
                    let focusCurrent = false;
                    if (pos < 0)
                    {
                        pos = 0;
                        focusCurrent = true;
                    }
                    
                    const newPos = n === 0 ? 0 : n === Infinity ? items.length - 1 : pos + n;
                    if (newPos >= 0 && newPos < items.length)
                    {
                        const item = items[newPos];
                        item.focus();
                        ctx.select(item.dataset.sel);
                    }
                    else
                    {
                        if (focusCurrent)
                        {
                            const item = items[pos];
                            item.focus();
                            ctx.select(item.dataset.sel);
                        }
                    }
                    //console.log("down", {items});
                }
                else
                {
                    //console.log({keyCode})
                }
            }
        }
    };

    return (
        <Manager>
            <ul
                id={ id }
                ref={ treeRef }
                className="tree-widget m-3"
                role="tree"
                aria-labelledby={ labelledBy }
                onKeyDownCapture={ onKeyDown }
            >
                <TreeContext.Provider value={ ctx }>
                    { children }
                </TreeContext.Provider>
            </ul>
        </Manager>
    );
};

Tree.propTypes = {
    /**
     * Unique HTML element id for the tree
     */
    id : PropTypes.string,
    /**
     * Pass-trough attribute for the aria-labelledby of the tree.
     */
    "aria-labelledby": PropTypes.string,

    /**
     * Tree options
     */
    options: PropTypes.shape({
        /**
         * Propper modifiers condiguration for the context menu.
         */
        popperModifiers: PropTypes.object,

        /**
         * True if the tree should render small button variants.
         */
        small: PropTypes.bool
    })
};

Tree.displayName = "Tree";

Tree.Context = TreeContext;
Tree.Objects = Objects;
Tree.Folder = Folder;
Tree.IndexedObjects = IndexedObjects;
Tree.MetaItem = MetaItem;

export default Tree;
