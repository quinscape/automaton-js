import React, { useState } from "react"
import { observer as fnObserver } from "mobx-react-lite";
import { CONDITION_METHODS, Type } from "../../FilterDSL";
import { ConditionInput } from "./ConditionInput";

import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import { Icon } from "domainql-form";
import { getArgumentCount, join } from "./InteractiveQueryEditor";
import ConditionList from "./ConditionList";
import ConditionDropdown, { hasUndefinedScalarTypes } from "./ConditionDropdown";
import i18n from "../../i18n";

export function getInputValue(node)
{
    if (!node)
    {
        return "";
    }

    if (node.type === Type.VALUE)
    {
        return node.value;
    }
    else
    {
        return node.name;
    }
}


const ConditionEditor = fnObserver(({root, node, path, state, level = 0, renderControls = null}) => {


    if (node === null)
    {
        return (
            <div className="form-row">
                <div className="col-3" style={{paddingLeft: (level * 2) + "em" }}>
                    <ConditionInput
                        key="solo"
                        root={ root }
                        path={ path }
                        state={ state }
                        level={ level + 1 }
                    />
                </div>
                <div className="col-1">
                    {
                        typeof renderControls === "function" && renderControls()
                    }
                </div>
            </div>
        );
    }
    else if (getArgumentCount(node.name) === 1)
    {
        return (
            <>
                <div className="form-row">
                    <div className="col-9" style={{paddingLeft: (level * 2) + "em"}}>
                        <span className="complex text-primary">
                            { node.name }
                        </span>
                    </div>
                    {
                        typeof renderControls === "function" && renderControls()
                    }
                    <div className="col-1">
                            <ConditionDropdown
                                node={ node }
                                path={ path }
                                state={ state }
                            />
                        {
                            typeof renderControls === "function" && renderControls()
                        }
                    </div>
                </div>
                <ConditionEditor
                    key={ "multi" }
                    root={root}
                    node={node.operands[0]}
                    path={join(path, ["operands", 0])}
                    state={state}
                    level={level + 1}
                />
            </>
        )

    }
    else if (node.type === Type.CONDITION && CONDITION_METHODS[node.name])
    {
        return (
            <ConditionList
                root={ root }
                node={ node }
                path={ path }
                state={ state }
                level={ level }
                renderControls={ renderControls }
            />
        );
    }
    else if (node.type === Type.OPERATION || node.type === Type.CONDITION)
    {
        const count = getArgumentCount(node.name) - 1;

        const isInvalid = hasUndefinedScalarTypes(node);

        return (
            <div className="form-row">
                <div className="col-3" style={{paddingLeft: (level * 2) + "em" }}>
                    <ConditionInput
                        key="field"
                        initialInputValue={ getInputValue(node.operands[0]) }
                        root={ root }
                        path={ join(path, ["operands", 0]) }
                        state={ state }
                        typeFilter={ Type.FIELD }
                    />
                </div>
                <div className="col-2">
                    <ConditionInput
                        key="op"
                        initialInputValue={ node.name }
                        root={ root }
                        path={ path }
                        state={ state }
                        typeFilter={ Type.OPERATION }
                    />
                </div>
                {
                    count === 1 ? (
                        <div className="col-4">
                            <ConditionInput
                                key="val"
                                inputClass={ isInvalid && "is-invalid"}
                                initialInputValue={ getInputValue(node.operands[1]) }
                                root={ root }
                                path={ join(path, ["operands", 1]) }
                                typeFilter={ Type.VALUE }
                                state={ state }
                            />
                            {
                                isInvalid && <small className="invalid-feedback d-block">
                                    {
                                        i18n("Value Type undefined")
                                    }
                                </small>
                            }
                        </div>
                    ) : (
                        <>
                            <div className="col-2">
                                <ConditionInput
                                    key="val1"
                                    inputClass={ isInvalid && "is-invalid"}
                                    initialInputValue={ getInputValue(node.operands[1]) }
                                    root={ root }
                                    path={ join(path, ["operands", 1]) }
                                    typeFilter={ Type.VALUE }
                                    state={ state }
                                />
                                {
                                    isInvalid && <small className="invalid-feedback d-block">
                                        <span>
                                            {
                                                i18n("Value Type undefined")
                                            }
                                        </span>
                                    </small>
                                }
                            </div>
                            <div className="col-2">
                                <ConditionInput
                                    key="val2"
                                    inputClass={ isInvalid && "is-invalid"}
                                    initialInputValue={ getInputValue(node.operands[2]) }
                                    root={ root }
                                    path={ join(path, ["operands", 2]) }
                                    typeFilter={ Type.VALUE }
                                    state={ state }
                                />
                            </div>
                        </>
                    )
                }
                <div className="col-1">
                    <div className="d-inline-block">
                        <ConditionDropdown
                            node={ node }
                            path={ path }
                            state={ state }
                        />
                    </div>
                    {
                        typeof renderControls === "function" && renderControls()
                    }
                </div>
            </div>
       )
    }

});

ConditionEditor.displayName = "ConditionEditor";

export default ConditionEditor;
