import React, { useState } from "react"
import { observer } from "mobx-react-lite";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { and, or, not, toJSON, Type, field, condition as dslCondition, value as dslValue } from "../../FilterDSL";
import i18n from "../../i18n";
import toPath from "lodash.topath"
import get from "lodash.get"
import { toJS } from "mobx";


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

function remove(path, conditionRoot, editorState, parent, parentPath)
{
    const condition = path.length ? get(conditionRoot, path) : conditionRoot;

    if (parent.type === Type.OPERATION)
    {
        if (parent.operands.length === 1)
        {
            console.log("Remove op Parent", parentPath)
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


const ExpressionDropdown = observer(function ExpressionDropdown({path, condition, editorState }) {

    const [ isOpen, setOpen ] = useState()

    const toggle = () => setOpen(prevState => !prevState)

    // our paths are relative to the *global* root
    const { conditionRoot } = editorState

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
        <Dropdown className="ml-3" isOpen={ isOpen } toggle={ toggle }>
            <DropdownToggle color="link">
                &hellip;
            </DropdownToggle>
            <DropdownMenu
                size="sm"
            >
                {
                    parent && parent.type === Type.OPERATION && (
                        <DropdownItem
                            onClick={ () =>  {
                                editorState.openOperationDialog(parent, parentPath, false)
                            }}
                        >
                            {
                                i18n("ConditionEditor:Change Operation ...")
                            }
                        </DropdownItem>

                    )
                }
                {
                    condition.type === Type.FIELD && (
                        <DropdownItem
                            onClick={ () =>  {
                                editorState.replaceCondition(
                                    toJSON(dslValue("")),
                                    path
                                )
                            }}
                        >
                            {
                                i18n("ConditionEditor:Change To Value")
                            }
                        </DropdownItem>

                    )
                }
                {
                    condition.type === Type.VALUE && (
                        <DropdownItem
                            onClick={ () =>  {
                                editorState.replaceCondition(
                                    toJSON(field("")),
                                    path
                                )
                            }}
                        >
                            {
                                i18n("ConditionEditor:Change To Field")
                            }
                        </DropdownItem>

                    )
                }
                <DropdownItem
                    onClick={ () =>  {
                        editorState.openOperationDialog(condition, path, true)
                    }}
                >
                    {
                        i18n("ConditionEditor:Wrap ...")
                    }
                </DropdownItem>
                <DropdownItem
                    onClick={ () =>  {
                        //console.log("remove(", path, ", ", toJS(conditionRoot), "//condition", toJS(condition));
                        remove(path, editorState.conditionRoot, editorState, parent, parentPath)
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

export default ExpressionDropdown;
