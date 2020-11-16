import { observer as fnObserver } from "mobx-react-lite";
import React, { useMemo, useState } from "react";
import { CONDITION_METHODS, FIELD_CONDITIONS, FIELD_OPERATIONS, Type } from "../../FilterDSL";
import { getFields, lookupType, unwrapAll, unwrapNonNull } from "../../util/type-utils";
import { SCALAR } from "domainql-form/lib/kind";
import Downshift from "downshift";
import i18n from "../../i18n";
import { Icon } from "domainql-form";
import cx from "classnames";
import { getInputValue } from "./ConditionEditor";
import config from "../../config";


/**
 * By default we offer this much level deep of fields starting with the root type. Only when the user selects
 * fields deeper than that, they'll be considered, to.
 *
 * @type {number}
 */
export const FIELD_DEPTH = 4;


const menuStyles = {
    maxHeight: 80,
    overflowY: "scroll",
    backgroundColor: '#eee',
    padding: 0,
    listStyle: "none",
    position: "relative",
};

const comboboxStyles = {
    display: "inline-block",
    marginLeft: "5px"
}

const iconsByType = {
    [Type.FIELD] : "fa-database",
    [Type.OPERATION] : "fa-calculator",
    [Type.CONDITION] : "fa-check-square"
}

const specialConditions = {
    "eq"  : "fa-equals",
    "equal"  : "fa-equals",

    "ne"  : "fa-not-equal",

    "le"  : "fa-less-than-equal",
    "lessOrEqual"  : "fa-less-than-equal",

    "lt"  : "fa-less-than",
    "lessThan"  : "fa-less-than",

    "ge"  : "fa-greater-than-equal",
    "greaterOrEqual"  : "fa-greater-than-equal",

    "gt"  : "fa-greater-than",
    "greaterThan"  : "fa-greater-than"
}

function sortItem(a,b)
{
    return a.name.localeCompare(b.name);
}


function getFilteredItems(items, inputValue)
{
    if (!inputValue)
    {
        return items;
    }

    const filtered = [];
    for (let i = 0; i < items.length; i++)
    {
        const item = items[i];

        if (item.name === inputValue)
        {
            filtered.unshift(item);
        }
        else if (item.name.includes(inputValue))
        {
            filtered.push(item);
        }
    }
    return filtered;
}

const InputState = {
    CLEAN: "CLEAN",
    DIRTY: "DIRTY",
    SELECTED: "SELECTED"
}

function log(v)
{
    console.log("INPUT PROPS", v);
    return v;
}


function toInput(set)
{
    if (set)
    {
        return  [... set].join(",")
    }
    else
    {
        return "";
    }
}


function addScalarFields(set, type, path, level)
{
    if (level >= FIELD_DEPTH)
    {
        return;
    }

    const typeDef = config.inputSchema.getType(type);

    const fields = getFields(typeDef);
    for (let i = 0; i < fields.length; i++)
    {
        const {name, type} = fields[i];

        const unwrapped = unwrapAll(type);

        const fieldPath = path ? path + "." + name : name;

        if (unwrapped.kind === SCALAR)
        {
            set.add(fieldPath);
        }
        else
        {
            addScalarFields(set, unwrapped.name, fieldPath, level + 1);
        }
    }
}


export const ConditionInput = fnObserver(({root, state, path, typeFilter, initialInputValue = "", inputClass}) => {


    const fields = state.fields;


    const [inputState, setInputState] = useState(InputState.CLEAN);

    // controlled input value for downshift dropdown
    const [inputValue, setInputValue] = useState(initialInputValue);

    let items = useMemo(
        () => {

            let items = [];

            if (!typeFilter || typeFilter === Type.FIELD || typeFilter === Type.VALUE)
            {

                const fieldsFromRoot = new Set();

                // recursively add possible scalar fields starting from root;
                addScalarFields(fieldsFromRoot, root, "", 0);

                // add those fields
                for (let name of fieldsFromRoot)
                {
                    items.push({
                        type: Type.FIELD,
                        name
                    });
                }

                // add fields selected by the user
                for (let name of fields)
                {
                    // skip if we already have the name
                    if (fieldsFromRoot.has(name))
                    {
                        continue;
                    }

                    const type = lookupType(root, name);
                    if (!type)
                    {
                        throw new Error("Cannot resolve " + root + "/" + name);
                    }

                    if (unwrapNonNull(type).kind === SCALAR)
                    {
                        // if we find a field we do not have yet, the user has selected a field beyond the
                        // FIELD_DEPTH limit
                        items.push({
                            type: Type.FIELD,
                            name
                        });
                    }
                }
            }

            if (!typeFilter || typeFilter === Type.OPERATION)
            {
                Object.keys(CONDITION_METHODS).forEach(name => items.push({
                    type: Type.CONDITION,
                    name
                }))
            }
            
            if (!typeFilter || typeFilter === Type.OPERATION || typeFilter === Type.VALUE)
            {
                Object.keys(FIELD_CONDITIONS).forEach(name => items.push({
                    type: Type.CONDITION,
                    name
                }))

                Object.keys(FIELD_OPERATIONS).forEach(name => items.push({
                    type: Type.OPERATION,
                    name
                }))
            }

            items.sort(sortItem);

            return items;

        },
        [typeFilter, toInput(fields)]
    )

    const changeSelection = (node) => {
        if (state.updateNode(node, path, !typeFilter))
        {
            setInputValue("");
        }
        else
        {
            setInputValue(getInputValue(node))
        }

        setInputState(InputState.SELECTED);
    };


    return (

        <Downshift
            inputValue={inputValue}
            onChange={ changeSelection }
            itemToString={(item) => (item ? item.name : "")}
        >
            {({
                  getInputProps,
                  getItemProps,
                  getMenuProps,
                  getLabelProps,
                  getToggleButtonProps,
                  inputValue,
                  highlightedIndex,
                  selectedItem,
                  isOpen,
                    setState
              }) => {


                // if (typeFilter === Type.VALUE)
                // {
                //     items = [
                //         {
                //             type: Type.VALUE,
                //             scalarType,
                //             value: inputValue
                //         },
                //         ... items
                //     ]
                // }

                const label = !typeFilter ? i18n("Field or Condition or Operation") : typeFilter === Type.FIELD ? i18n("Field") : i18n("Condition or operation");
                return (
                    <div className="form-group">
                        <label
                            {...getLabelProps()}
                            className="sr-only"
                        >
                            {
                                label
                            }
                        </label>

                        <div className="input-group">
                            <input
                                { ... getInputProps({
                                    className: cx("form-control", inputClass),
                                    placeholder: label,
                                    onChange: ev => {
                                        const newValue = ev.target.value;
                                        if (newValue !== inputValue)
                                        {
                                            setInputState(InputState.DIRTY)
                                            setInputValue(newValue);
                                        }
                                    },
                                    onFocus: ev => setInputState(InputState.CLEAN),
                                    onBlur: ev => {
                                        if (inputState === InputState.DIRTY)
                                        {
                                            if (typeFilter === Type.VALUE)
                                            {
                                                console.log("INSERT VALUE")

                                                changeSelection({
                                                    type: Type.VALUE,
                                                    // we temporarily assign null to the type until we can conclude it
                                                    // from the fields the value is compared to.
                                                    scalarType: null,
                                                    value: inputValue
                                                });
                                            }
                                            else
                                            {
                                                const filtered = getFilteredItems(items, inputValue);
                                                if (filtered.length)
                                                {
                                                    if (inputValue === filtered[0].name)
                                                    {
                                                        console.log("COPY FIRST", filtered)
                                                        changeSelection(filtered[0]);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                })}
                            />
                            <div className="input-group-append">
                                <button
                                    {...getToggleButtonProps()}
                                    className="btn btn-light border"
                                    aria-label={"toggle menu"}
                                >
                                    <Icon className="fa-chevron-down"/>
                                </button>
                            </div>
                        </div>
                        <ul
                            {...getMenuProps()}
                            style={menuStyles}
                        >
                            {
                                isOpen && getFilteredItems(items, inputValue)
                                    .map(
                                        (item, index) => {

                                            const {type, name} = item;

                                            const pos = inputValue && name.indexOf(inputValue);

                                            return (
                                                <li
                                                    {...getItemProps({
                                                        key: name + index,
                                                        item,
                                                        index,
                                                        style: {
                                                            backgroundColor:
                                                                highlightedIndex === index ? "lightgray" : "white",
                                                            fontWeight: selectedItem === item ? "bold" : "normal",
                                                        },
                                                    })}
                                                >

                                                    <Icon className={
                                                        cx(
                                                            (type === Type.CONDITION && specialConditions[name]) ||
                                                            iconsByType[type],
                                                            "text-primary mr-2"
                                                        )
                                                    }/>
                                                    {
                                                        !inputValue ? name : name === inputValue ? (
                                                            <>
                                                                <strong className="text-primary">
                                                                    {
                                                                        name
                                                                    }
                                                                </strong>
                                                                <span className="text-muted">
                                                                {
                                                                    " " + i18n("exact match")
                                                                }
                                                            </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {
                                                                    name.substr(0, pos)
                                                                }
                                                                <strong className="text-primary">
                                                                    {
                                                                        inputValue
                                                                    }
                                                                </strong>
                                                                {
                                                                    name.substr(pos + inputValue.length)
                                                                }
                                                            </>
                                                        )
                                                    }
                                                </li>
                                            );
                                        }
                                    )
                            }
                        </ul>
                    </div>
                );
            }}
        </Downshift>

    )

});
