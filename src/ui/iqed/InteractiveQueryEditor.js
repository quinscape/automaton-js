import React, { useEffect } from "react"
import { observer as fnObserver, useLocalStore } from "mobx-react-lite";
import { Field, Form, Addon, Icon } from "domainql-form";
import { ButtonToolbar } from "reactstrap";
import i18n from "../../i18n";
import FieldSelector from "./FieldSelector";
import RootTypeSelector from "./RootTypeSelector";
import { CONDITION_METHODS, FIELD_CONDITIONS, FIELD_OPERATIONS } from "../../FilterDSL";
import ConditionEditor from "./ConditionEditor";
import { EditorState } from "./EditorState";
import ConditionJSONDialog from "./ConditionJSONDialog";
import ConditionTree from "./ConditionTree";
import graphql from "../../graphql";
import { getFirstValue } from "../../model/InteractiveQuery";
import JsonTable from "./JsonTable";
import Pagination from "../Pagination";


export function getArgumentCount(name)
{
    const opCount = FIELD_OPERATIONS[name];
    if (opCount !== undefined)
    {
        return opCount + 1;
    }

    const condCount = FIELD_CONDITIONS[name];
    if (condCount !== undefined)
    {
        return condCount + 1;
    }

    const condMethCount = CONDITION_METHODS[name];

    if (condMethCount === undefined)
    {
        throw new Error("Unknown function: " + name);
    }

    return condMethCount + 1;
}


export function join(path, otherPath)
{
    if (path)
    {
        return path.concat(otherPath);
    }
    else
    {
        return otherPath;
    }
}


const stateMap = new Map();

const InteractiveQueryEditor = fnObserver(({id, definition}) => {

    const state = useLocalStore(() => new EditorState())

    // if (__DEV)
    // {
    //     useEffect(
    //         () => reaction(
    //             () => JSON.stringify(state.queryConfig.condition, null, 4),
    //                 json => console.log("CONDITION", json)
    //         ),
    //         []
    //     )
    // }

    useEffect(
        () => {
            stateMap.set(id, state);
            return () => {
                stateMap.delete(id);
            }
        },
        []
    )

    const {root, rootConfirmed, queryConfig, fields, queryResult} = state;

    const condition = queryConfig && queryConfig.condition;

    useEffect(
        () => {
            state.importFrom(definition);
        },
        []
    );

    const executeQuery = () => {
        const def = state.toInteractiveQueryDefinition();

        //console.log(toJS(def));

        return graphql({
            query: def.query,
            variables: {
                config: def.queryConfig
            }
        }).then(result => {
            const iQuery = getFirstValue(result);
            state.setQueryResult(iQuery);
        })

    }

    return (
        <>
            {
                !root || !rootConfirmed ? (
                    <RootTypeSelector state={state}/>
                ) : (
                    <>
                        <div className="row">
                            <div className="col">
                                <h1>Abfrage bearbeiten</h1>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                <Form value={state}>
                                    <Field name="name" type="String" label="Name">
                                        <Addon placement={Addon.LEFT} text={true}>
                                            <Icon className="fa-book"/>

                                        </Addon>
                                    </Field>
                                </Form>
                            </div>
                            <div className="col">
                                <label htmlFor="field-selector-field-filter">Search Fields</label>
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                    <span className="input-group-text">
                                        <Icon className="fa-search"/>
                                    </span>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Nach Feld-Name oder -Beschreibung filtern"
                                        value={ state.fieldFilter}
                                        onChange={ev => state.setFieldFilter(ev.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col">
                                TEMPLATE-VARIABLES
                            </div>
                            <div className="col">
                                <FieldSelector
                                    fieldFilter={ state.fieldFilter }
                                    setFieldFilter={ state.setFieldFilter }
                                    node={ root }
                                    editorState={ state }
                                />
                            </div>
                        </div>
                        <hr/>
                        <div className="row">
                            <div className="col">
                                <ConditionTree
                                    editorState={ state }
                                />
                            </div>
                            <ConditionJSONDialog
                                editorState={ state }
                            />
                        </div>
                    </>

                )
            }
        </>
    );
});

InteractiveQueryEditor.getInteractiveQueryDefinition = (id) => {
    const state = stateMap.get(id);
    if (!state)
    {
        throw new Error("No InteractiveQueryEditor with id '" + id + "' registered");
    }

    return state.toInteractiveQueryDefinition();
}

export default InteractiveQueryEditor;
