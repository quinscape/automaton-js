import React from "react"
import cx from "classnames"
import { observer as fnObserver } from "mobx-react-lite";
import { join } from "./InteractiveQueryEditor";
import ConditionEditor from "./ConditionEditor";
import { Icon } from "domainql-form";
import i18n from "../../i18n";
import ConditionDropdown from "./ConditionDropdown";


const ConditionList = fnObserver(({title, root, node, path, fields, state, level = 0, renderControls = null}) => {

    const addCondition = () => {

        const newArray = node.operands.slice();
        newArray.push(null);

        state.setNodeValue(join(path, ["operands"]), newArray);

    };

    const removeCondition = idx => {

        const newArray = node.operands.slice();
        newArray.splice(idx, 1);

        state.setNodeValue(join(path, ["operands"]), newArray);
    }


    return (
        <>
            <div className="form-row">
                <div className="col-9" style={{paddingLeft: (level * 2) + "em" }}>
                        <span className="complex text-primary">
                            {
                                node.name + "("
                            }
                        </span>
                </div>
                <div className="col-1">
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
            <div className="form-row">
                <div className="col mb-2" style={{paddingLeft: ((level + 1) * 2) + "em" }}>
                    <button
                        type="button"
                        className="btn btn-light border btn-sm"
                        onClick={ addCondition }
                    >
                        <Icon className="fa-plus mr-1"/>
                        {
                            i18n("Add")
                        }
                    </button>
                </div>
            </div>
            {
                node.operands.map((op, idx) => (
                    <ConditionEditor
                        key={idx}
                        root={root}
                        node={op}
                        path={join(path, ["operands", idx])}
                        state={state}
                        level={level + 1}
                        renderControls={ () => (
                            <button
                                type="button"
                                className="btn btn-link"
                                aria-label={ i18n("Remove condition")}
                                onClick={ () => removeCondition(idx) }
                            >
                                <Icon className="fa-times"/>
                            </button>
                        )}
                    />
                ))
            }

            <div className="form-row">
                <div className="col" style={{paddingLeft: (level * 2) + "em" }}>
                    <span className="complex text-primary">)</span>
                </div>
            </div>
        </>
    );
});

export default ConditionList;
