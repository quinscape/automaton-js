import React, { useState } from "react"
import { observer } from "mobx-react-lite";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { and, or, not, toJSON, Type, condition as dslCondition } from "../../FilterDSL";
import i18n from "../../i18n";
import toPath from "lodash.topath"
import get from "lodash.get"
import { toJS } from "mobx";


function remove(path, conditionRoot, editorState)
{
    const condition = path.length ? get(conditionRoot, path) : conditionRoot;

    const arrayPath = toPath(path);
    if (arrayPath.length >= 2)
    {
        const parentPath = arrayPath.slice(0, -2);
        const parent = parentPath.length ? get(conditionRoot, parentPath) : conditionRoot;
        if (parent.type === Type.CONDITION)
        {
            if (parent.name === "not")
            {
                console.log("Remove NOT", parentPath)
                remove(parentPath, conditionRoot, editorState);
            }
            else if (parent.name === "and" || parent.name === "or")
            {
                if (parent.operands.length === 1)
                {
                    console.log("Remove Logical Parent", parentPath)
                    remove(parentPath, conditionRoot, editorState);
                }
                else if (parent.operands.length === 2)
                {
                    const a = parent.operands[0];
                    const b = parent.operands[1];
                    const other = condition === a ? b : a;

                    editorState.replaceCondition(other, parentPath);
                }
                else
                {
                    const newCondition = dslCondition(parent.name, parent.operands.filter( o => o !== condition));
                    editorState.replaceCondition(toJSON(newCondition), parentPath);
                }
            }
        }
    }
    else
    {
        editorState.replaceCondition(null);
    }
}


function findIndex(operands, condition)
{
    for (let i = 0; i < operands.length; i++)
    {
        if (operands[i] === condition)
        {
            return i;
        }
    }
    throw new Error("Element not found")
}


const ConditionDropdown = observer(function ConditionDropdown({path, conditionRoot, condition, editorState }) {

    const [ isOpen, setOpen ] = useState()

    const toggle = () => setOpen(prevState => !prevState)

    const { opts } = editorState;

    const arrayPath = toPath(path);
    let parentPath = null;
    let parent = null;
    if (arrayPath.length >= 2)
    {
        parentPath = arrayPath.slice(0, -2);
        parent = parentPath.length ? get(conditionRoot, parentPath) : conditionRoot;
    }

    return (
        <Dropdown className="ml-3 float-right" isOpen={ isOpen } toggle={ toggle }>
            <DropdownToggle color="link">
                &hellip;
            </DropdownToggle>
            <DropdownMenu
                size="sm"
            >
                <DropdownItem
                    onClick={ () =>  {

                        const newCondition = toJSON(
                            and(
                                condition,
                                opts.defaultCondition()
                            )
                        );
                        editorState.replaceCondition(newCondition, path);
                    }}
                >
                    {
                        i18n("ConditionEditor:Wrap AND")
                    }

                </DropdownItem>
                <DropdownItem
                    onClick={ () =>  {
                        const newCondition = toJSON(
                            or(
                                condition,
                                opts.defaultCondition()
                            )
                        );
                        editorState.replaceCondition(newCondition, path);
                    }}
                >
                    {
                        i18n("ConditionEditor:Wrap OR")
                    }

                </DropdownItem>
                <DropdownItem
                    onClick={ () =>  {

                        if (parent && parent.type === Type.CONDITION && parent.name === "not")
                        {
                            console.log("REMOVE NOT", parentPath)
                            editorState.replaceCondition(condition, parentPath);
                            return;
                        }
                        const newCondition = toJSON(
                            not(
                                condition
                            )
                        );
                        editorState.replaceCondition(newCondition, path);
                    }}
                >
                    {
                        i18n("ConditionEditor:Negate")
                    }
                </DropdownItem>
                {
                    parent && parent.name !== "not" && (
                        <>
                            <DropdownItem divider/>
                            <DropdownItem
                                onClick={ () =>  {
                                    if (parent && parent.type === Type.CONDITION && (parent.name === "and" || parent.name === "or"))
                                    {
                                        const newCondition = dslCondition(parent.name, [
                                            ... parent.operands
                                        ]);

                                        const index = findIndex(parent.operands, condition);

                                        newCondition.operands.splice(index + 1, 0, opts.defaultCondition())

                                        editorState.replaceCondition(toJSON(newCondition), parentPath);
                                    }
                                }}
                            >
                                {
                                    i18n("ConditionEditor:Add Condition")
                                }
                            </DropdownItem>
                        </>
                    )
                }
                <DropdownItem divider/>
                <DropdownItem
                    onClick={ () => editorState.openExpressionDialog(condition, path)}
                >
                    {
                        i18n("ConditionEditor:Expressions")
                    }
                </DropdownItem>
                <DropdownItem divider/>
                <DropdownItem
                    onClick={ () =>  {
                        remove(path, conditionRoot, editorState);
                    }}
                >
                    {
                        i18n("ConditionEditor:Remove")
                    }
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
});

export default ConditionDropdown;
