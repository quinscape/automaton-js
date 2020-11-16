import React, { useEffect } from "react"
import { observer as fnObserver, useLocalStore } from "mobx-react-lite";
import { Field, Form } from "domainql-form";
import { ButtonToolbar } from "reactstrap";
import i18n from "../../i18n";
import FieldSelector from "./FieldSelector";
import RootTypeSelector from "./RootTypeSelector";
import { CONDITION_METHODS, FIELD_CONDITIONS, FIELD_OPERATIONS } from "../../FilterDSL";
import ConditionEditor from "./ConditionEditor";
import { EditorState } from "./EditorState";
import ConditionJSONDialog from "./ConditionJSONDialog";
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

    if(condMethCount === undefined)
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



const InteractiveQueryEditor = fnObserver(({id, definition})=> {

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


    const { root, rootConfirmed, queryConfig, fields, queryResult } = state;

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
        <div className="iquery-editor">
            {
                !root || !rootConfirmed ? (
                    <RootTypeSelector state={state}/>
                ) : (
                    <>
                        <Form value={ state }>
                            <Field name="name" type="String"/>
                        </Form>
                        <h4>
                            {
                                i18n("Field Selection")
                            }
                        </h4>
                        <div className="field-selector row">
                            <div className="col">
                                <FieldSelector
                                    node={root}
                                    state={state}
                                />
                            </div>
                        </div>
                        <hr/>
                        <div className="row">
                            <div className="col-11">
                                <h4>
                                    {
                                        i18n("Condition")
                                    }
                                </h4>
                            </div>
                            <div className="col-1">
                            </div>
                        </div>
                        <ConditionEditor
                            root={root}
                            node={condition}
                            path={null}
                            state={state}
                        />
                        <ButtonToolbar>

                            <button
                                type="button"
                                className="btn btn-secondary mr-1"
                                onClick={ executeQuery }
                            >
                                Test
                            </button>
                        </ButtonToolbar>
                        <hr/>
                        {
                            queryResult && (
                                <>
                                    <JsonTable
                                        key={ state.queryId }
                                        domainType={ queryResult.type }
                                        value={ queryResult.rows }
                                        fields={ fields }
                                        editorState={ state }
                                    />
                                    <Pagination
                                        iQuery={ queryResult }
                                        description={ i18n("Result Navigation") }
                                    />
                                </>
                            )
                        }
                    </>
                )
            }
            <ConditionJSONDialog
                editorState={state}
            />
        </div>
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
