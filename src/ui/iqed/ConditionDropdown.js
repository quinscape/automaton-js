import React, { useRef, useState } from "react"
import { observer as fnObserver } from "mobx-react-lite";

import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Icon } from "domainql-form";
import i18n from "../../i18n";
import { CONDITION_METHODS, Type } from "../../FilterDSL";
import { openDialog } from "../Dialog";
import { join } from "./InteractiveQueryEditor";
import ValueTypeDialog from "./ValueTypeDialog";
import { toJS } from "mobx";


function wrap(op, node)
{
    return {
        type: Type.CONDITION,
        name: op,
        operands: [node]
    }
}


function isValueWithUndefinedType(node)
{
    const { type } = node;
    if (type === Type.VALUE || type === Type.VALUES)
    {
        return !node.scalarType;
    }
    return false;
}


export function hasUndefinedScalarTypes(node)
{
    if (!node)
    {
        return false;
    }

    const { type } = node;
    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { operands } = node;

        for (let i = 0; i < operands.length; i++)
        {
            const result = isValueWithUndefinedType(operands[i]);
            if (result)
            {
                return true;
            }
        }
    }
    return false;
}


function defineValueType(node, scalarType)
{
    const newNode = toJS(node);

    const { type } = node;

    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { operands } = node;

        for (let i = 0; i < operands.length; i++)
        {
            if (isValueWithUndefinedType(operands[i]))
            {
                newNode.operands[i].scalarType = scalarType;
            }
        }
    }
    return newNode;
}


const ConditionDropdown = fnObserver(({node, path, state}) => {

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggle = () => setDropdownOpen(prevState => !prevState);

    const canDissolve = node.type === Type.CONDITION && (node.name === "or" || node.name === "and") && node.operands.length <= 1;

    const needsValueType = hasUndefinedScalarTypes(node);

    return (
        <Dropdown isOpen={dropdownOpen} toggle={toggle}>
            <DropdownToggle color="light">
                <Icon className="fa-ellipsis-h mr-1"/>
            </DropdownToggle>
            <DropdownMenu>
                <DropdownItem
                    className="btn-sm"
                    onClick={ () => {
                        if (node.type === Type.CONDITION && node.name === "not")
                        {
                            state.setNodeValue(path, node.operands[0]);
                        }
                        else
                        {
                            state.setNodeValue(path, wrap("not", node));
                        }
                    }}
                >
                    {
                        i18n("Negate")
                    }
                </DropdownItem>
                <DropdownItem
                    onClick={ () => state.setNodeValue(path, null)}
                >
                    {
                        i18n("Clear")
                    }
                </DropdownItem>
                <DropdownItem header>
                    {
                        i18n("Wrap")
                    }
                </DropdownItem>
                <DropdownItem
                    className="btn-sm"
                    onClick={ () => state.setNodeValue(path, wrap("and", node))}
                >
                    {
                        i18n("... with AND")
                    }
                </DropdownItem>
                <DropdownItem
                    className="btn-sm"
                    onClick={ () => state.setNodeValue(path, wrap("or", node))}
                >
                    {
                        i18n("... with OR")
                    }
                </DropdownItem>
                <DropdownItem divider />
                {
                    canDissolve && (
                        <DropdownItem
                            className="btn-sm"
                            onClick={ () => {
                                const n = node.operands.length === 1 ? node.operands[0] : null;
                                state.setNodeValue(path, n);
                            }}
                        >
                            {
                                i18n("Dissolve")
                            }
                        </DropdownItem>
                    )
                }
                {
                    needsValueType && (
                        <DropdownItem
                            className="btn-sm"
                            onClick={ () => {
                                return openDialog(dialog => (
                                    <ValueTypeDialog
                                        dialog={ dialog }
                                    />
                                ),{
                                    title: i18n("Set Value Type")
                                })
                                    .then(result => {

                                        if (result)
                                        {
                                            state.setNodeValue(path, defineValueType(node, result));
                                        }
                                    })
                            }}
                        >
                            {
                                i18n("Set Value Type")
                            }
                        </DropdownItem>
                    )
                }
                <DropdownItem
                    className="btn-sm"
                    onClick={ () => {
                        state.updateJSON(path);
                        state.toggleJSONDialog();
                    }}
                >
                    {
                        i18n("JSON ...")
                    }
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
});

export default ConditionDropdown;
