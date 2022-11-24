import React, {useContext, useMemo, useReducer, useState} from "react"
import PropTypes from "prop-types"
import { observer as fnObserver } from "mobx-react-lite"
import get from "lodash.get";
import InteractiveQuery, { getFirstValue } from "../../model/InteractiveQuery";
import i18n from "../../i18n";
import unicodeSubstring from "unicode-substring";

import { field, value } from "../../FilterDSL"
import { appendRows, TreeContext } from "./Tree";
import ObjectItem from "./ObjectItem";
import updateComponentCondition from "../../util/updateComponentCondition";
import config from "../../config";
import MoreItem from "./MoreItem";
import IndexItem from "./IndexItem";


function firstLetter(name)
{
    return unicodeSubstring(name, 0, 1).toLocaleUpperCase();
}

function findLetter(rows, nameField, letter)
{

    let last = -1, count = 0;
    for (let i = rows.length - 1; i >= 0; i--)
    {
        const row = rows[i];

        const name = get(row, nameField);

        if (firstLetter(name) === letter)
        {
            if  ( last === -1)
            {
                last = i;
            }
            count++;
        }
    }

    const result = {
        count,
        insertPos: last + 1
    };

    //console.log("findLetter: ", rows, "=>", result);

    return result;
}

const OPEN = "OPEN";
const SET_LOAD_STATE = "SET_LOAD_STATE";
const REPLACE_STATE = "REPLACE_STATE";

const LoadState = {
    INITIAL: 0,
    FETCHED: 1,
    DONE: 2
};

function reducer(state, action)
{
    //console.log({ state, action });

    let newState;

    switch(action.type)
    {
        case OPEN:
        {
            const { letter, open } = action;

            newState = {
                ... state,
                [letter] : {
                    ... state[letter],
                    open
                }
            };

            break;
        }

        case SET_LOAD_STATE:
        {
            const { letter, loadState } = action;

            newState = {
                ... state,
                [letter] : {
                    ... state[letter],
                    loadState
                }
            };
            break;
        }

        case REPLACE_STATE:
        {
            newState = action.newState;
            break;
        }

        default:
            throw new Error("Unhandled action: " + action.type)
    }

    //console.log("reducer", newState);

    return newState;
}


function createInitialState(index, values, nameField)
{
    const state = {};

    for (let i = 0; i < index.length; i++)
    {
        const letter = index[i];
        state[letter] = {
            loadState: LoadState.INITIAL,
            open: false
        };
    }
    
    // injected or requested database rows, must be sorted by name field
    const { rows } = values;
    for (let i = 0; i < rows.length; i++)
    {
        const row = rows[i];

        const name = get(row, nameField);

        if (!name)
        {
            throw new Error("No name in field '" + nameField + "' for row: " + JSON.stringify(row));
        }

        const letter = firstLetter(name);

        const idx = index.indexOf(letter);
        if (idx < 0)
        {
            throw new Error("Letter '" + letter + "' is not included in the index array.");
        }
        // if we reach a new index, that means we've already found all entries with the previous letter and
        // can mark that group as being fully loaded if it isn't already
        if (idx > 0 && state[index[idx - 1]].loadState !== LoadState.DONE)
        {
            state[index[idx - 1]].loadState = LoadState.DONE;
        }

        if (state[letter].loadState === LoadState.INITIAL)
        {
            state[letter].loadState = LoadState.FETCHED;
        }
    }

    return state;
}


function findLetterIndex(index, letter)
{
    for (let i = 1; i < index.length; i++)
    {
        const curr = index[i];
        if (curr === letter)
        {
            return i;
        }
    }
    return null;
}


/**
 * Default renderIndex function that simply returns the given string
 */
function renderIndexDefault(letter)
{
    return letter;
}


const IndexedObjects = fnObserver(({
    render,
    renderIndex = renderIndexDefault,
    values: valuesFromProps,
    index,
    headingActions,
    actions,
    nameField = "name",
    altText,
    heading = "",
    children
}) => {

    const ctx = useContext(TreeContext);

    const values = useMemo(
        () => {
            if (config.skipIndexTreeCloning)
            {
                console.log("IndexedObjects: skip cloning")
                return valuesFromProps;
            }
            const clone = config.inputSchema.clone(valuesFromProps);
            clone._query = valuesFromProps._query;
            return clone;
        },
        []
    );

    const [dropDown, setDropDown] = useState(-1);

    const [state, dispatch] = useReducer(reducer, null, () => createInitialState(index, values, nameField));

    const loadMore = (letter, wasSelected) => {
        const { queryConfig, _query: query } = values;

        const { count, insertPos } = findLetter(values.rows, nameField, letter);

        if (count === 0)
        {
            throw new Error("No rows with letter '" + letter + "' found (name field = '" + nameField + "'): " + JSON.stringify(rows));
        }

        const condition = updateComponentCondition(
            queryConfig.condition,
            field(nameField).startsWith(
                value(
                    letter,
                    "String"
                )
            ),
            ctx.id,
            false
        );

        return query.execute({
                config: {
                    ...queryConfig,
                    condition,
                    offset: count
                }
            })
            .then(data => {

                const newRows = getFirstValue(data);

                // The "more" link is currently focused and is about to be replaced
                // so we remember the list index of the current selected item.
                const selectionIndex = wasSelected && ctx.findSelectionIndex(ctx.selected);

                if (newRows.rows.length < newRows.queryConfig.pageSize)
                {
                    dispatch({
                        type: SET_LOAD_STATE,
                        letter,
                        loadState: LoadState.DONE
                    })
                }

                appendRows(values, newRows, nameField, insertPos);
                processRows(newRows, letter);

                if (wasSelected && selectionIndex >= 0)
                {
                    // we reselect the previous item index, selecting the item that has replaced
                    setTimeout(
                        () => ctx.selectByIndex(selectionIndex),
                        1   // just put it at the end of the current chain
                    );
                }

            })
            .catch(err => console.error(err))

    };

    const toggleGroup = (open,letter) => {

        if (state[letter].loadState !== LoadState.INITIAL)
        {
            dispatch({ type: OPEN, open, letter });
        }
        else
        {
            //console.log("toggleGroup", open, letter);

            const { queryConfig, rowCount, _query : query } = values;

            //console.log("MORE", toJS(queryConfig), "rowCount", rowCount);

            let insertPos = -1;
            let idx = findLetterIndex(index,letter);

            if (!idx)
            {
                // first not fetched, we insert at start
                insertPos = 0;
            }
            else
            {
                let prevLetter;
                do
                {
                    prevLetter = index[--idx];

                } while ( idx > 0 && state[prevLetter].loadState === LoadState.INITIAL)


                if (idx < 0)
                {
                    insertPos = 0;
                }
                else
                {
                    insertPos = findLetter(values.rows, nameField, prevLetter).insertPos;
                }
            }

            const condition = updateComponentCondition(
                queryConfig.condition,
                field(nameField).startsWith(
                    value(
                        letter,
                        "String"
                    )
                ),
                ctx.id,
                false
            );

            return query.execute({
                    config: {

                        ...queryConfig,
                        condition: condition,
                        offset: 0
                    }
                })
                .then(data => {

                    const newRows = getFirstValue(data);

                    //console.log("TOGGLE GROUP", newRows);

                    if (newRows.rows.length)
                    {
                        appendRows(values, newRows, nameField, insertPos);
                        processRows(newRows, letter);
                    }

                    if (newRows.rows.length < newRows.queryConfig.pageSize)
                    {
                        dispatch({
                            type: SET_LOAD_STATE,
                            letter,
                            loadState: LoadState.DONE
                        });
                    }
                });

        }
    };

    const processRows = (newValues, letter) =>
    {

        //console.log("processRows", toJS(newValues), nameField, dispatch);

        const { rows } = newValues;

        let lastLetter = letter;

        const newState = {
            ... state
        };

        let modified = false;

        for (let i = 0; i < rows.length; i++)
        {
            const row = rows[i];

            const letter = firstLetter(get(row, nameField));

            if (!newState[letter].open)
            {
                //console.log("open", letter);
                newState[letter] = {
                    ... newState[letter],
                    open : i === 0
                };

                if (newState[letter].loadState === LoadState.INITIAL)
                {
                    newState[letter].loadState = LoadState.FETCHED;
                }
                modified = true;
            }

            if (lastLetter && lastLetter !== letter && newState[lastLetter].loadState !== LoadState.DONE)
            {
                //console.log("mark done", lastLetter, LoadState.DONE);

                newState[lastLetter] = {
                    ... newState[lastLetter],
                    loadState : LoadState.DONE
                };

                modified = true;
            }

            lastLetter = letter;
        }

        if (modified)
        {
            dispatch({
                type: REPLACE_STATE,
                newState
            })
        }
    };


    const { rows } = values;

    let count = 0;
    return (
        <React.Fragment>
            {
                (index.length === 0 || rows.length === 0) && (
                    <li className="tree-item">
                        <div className="text-muted small no-gutter">
                            {
                                i18n("No Results")
                            }
                        </div>
                    </li>
                )
            }
            {
                !!rows.length &&
                index.map(
                    (letter, idx) => {

                        const rowsForLetter = rows.filter(row => unicodeSubstring(get(row, nameField), 0, 1).toLocaleUpperCase() === letter);

                        return (
                            <IndexItem
                                key={ idx }
                                letter={ letter }
                                open={ state[letter].open }
                                setOpen={ open => toggleGroup(open, letter) }
                                render={ renderIndex }
                                altText={ altText }
                                heading={ heading }
                                headingActions={headingActions}
                            >

                                {
                                    rowsForLetter.map((row, idx) => (
                                        <ObjectItem
                                            key={ idx }
                                            index={ count++ }
                                            render={ render }
                                            actions={ actions }
                                            row={ row }
                                            dropDown={ dropDown }
                                            setDropDown={ setDropDown }
                                            renderKid={ children }
                                        />
                                    ))
                                }
                                {
                                    state[letter].loadState !== LoadState.DONE && (
                                        <MoreItem
                                            onMore={ wasSelected => loadMore(letter, wasSelected) }
                                        />
                                    )
                                }
                            </IndexItem>
                        );
                    }
                )
            }
        </React.Fragment>
    );
});


IndexedObjects.propTypes = {
    /**
     * Render prop for a data row. Receives the row and returns a react element tree or simple renderable values.
     */
    render  : PropTypes.func.isRequired,

    /**
     * Render prop for an index row. Receives the first unicode character and returns a react element tree or simple
     * renderable values
     */
    renderIndex : PropTypes.func,

    /**
     * iQuery document, either injected or loaded with a wrapping <Tree.Folder/>
      */
    values: PropTypes.instanceOf(InteractiveQuery).isRequired,

    /**
     * Index containing all initial unicode characters of entries in an array
     */
    index: PropTypes.arrayOf(
        PropTypes.string
    ),

    /**
     * Array of menu entries with label and action function. The first action is the default action that is also
     * executed on item click.
     */
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            /** Label for the action for function to render a decorated label */
            label: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.func
            ]).isRequired,
            /** Action function for the action */
            action: PropTypes.func.isRequired
        })
    ).isRequired,

    /**
     * Name field / path expression for the display name within the data rows. Default is "name"
     */
    nameField: PropTypes.string,

    /**
     * Function that produces an alt-text for each index item given the initial letter ( letter => altText ).
     *
     * Default is using `i18n("Toggle Items starting with {0}", letter)`
     *
     */
    altText: PropTypes.func,

    /**
     * Optional heading to display as separate item between main item and index item.
     */
    heading: PropTypes.string
};
IndexedObjects.displayName = "Tree.IndexedObjects";

export default IndexedObjects;
