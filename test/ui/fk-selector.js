import React from "react"
import sinon from "sinon"
import assert from "power-assert"
import userEvent from "@testing-library/user-event";
import { observer as fnObserver } from "mobx-react-lite"
import {
    act,
    getByLabelText,
    getByText,
    prettyDOM,
    render,
    waitForElement,
    waitForElementToBeRemoved
} from "@testing-library/react"
import { FormConfigProvider, InputSchema, WireFormat, withForm } from "domainql-form"

import config from "../../src/config"
import InteractiveQuery from "../../src/model/InteractiveQuery"
import FKSelector from "../../src/ui/FKSelector";
import GraphQLQuery from "../../src/GraphQLQuery"
import { field, value } from "../../src/FilterDSL"
import { createMockedQuery } from "./createMockedQuery";


const rawSchema = require("./fk-schema.json");

let executeSpy;

function selectFromModal(fkSelector, text)
{
    //console.log("fkSelector", prettyDOM(fkSelector.parentNode))

    const button = fkSelector.parentNode.querySelector("button");

    act(
        () => {
            button.click();
        }
    );

    return waitForElement( () => document.querySelector(".modal"))
        .then( modal => {

            if (text === null)
            {
                //console.log("SELECT none");
                act(
                    () => {
                        getByText(modal, "[Select None]").click();
                    }
                )
            }
            else
            {
                const rowElems = modal.querySelectorAll("tr.data");

                for (let i = 0; i < rowElems.length; i++)
                {
                    const rowElem = rowElems[i];
                    const rowText = rowElem.textContent;
                    //console.log("ROW TEXT", rowText);
                    if (rowText.indexOf(text) >= 0)
                    {
                        act(
                            () => {
                                //console.log("SELECT #" + i);
                                rowElem.querySelector("button").click();
                            }
                        );
                        break;
                    }
                }
            }

            return waitForElementToBeRemoved( () => document.querySelector(".modal"));
        })

}


const TestForm = withForm(
    fnObserver(
        props => {

            const { formConfig } = props;

            const { root } = formConfig;

            return (
                <React.Fragment>
                    <FKSelector
                        name="quxAId"
                        display={() => root.quxA.name}
                        required={true}
                        query={Q_QuxA}
                        fade={ false }
                    />

                    <FKSelector
                        name="quxBName"
                        targetField="name"
                        helpText={"Select a QuxB"}
                        query={Q_QuxB}
                        fade={ false }
                    />

                    <FKSelector
                        name="quxCId1"
                        display={() => root.quxC1.name}
                        onUpdate={
                            row => formConfig.root.quxC1 = row
                        }
                        query={Q_QuxC}
                        fade={ false }
                    />

                    <FKSelector
                        name="quxCId2"
                        display={() => root.quxC2 && root.quxC2.name}
                        onUpdate={
                            row => formConfig.root.quxC2 = row
                        }
                        query={Q_QuxC}
                        fade={ false }
                    />

                    <FKSelector
                        label="quxD"
                        display="quxD.name"
                        query={Q_QuxD}
                        fade={ false }
                    />

                    <FKSelector
                        label="quxE"
                        display="quxE.name"
                        validateInput="value"
                        query={Q_QuxE}
                        fade={ false }
                    />

                    <FKSelector
                        label="quxF"
                        validateInput={
                            val => field("name")
                                .eq(
                                    value(
                                        val
                                    )
                                )
                        }
                        display="quxF.name"
                        query={Q_QuxF}
                        fade={ false }
                    />

                    <button type="submit">Submit</button>

                </React.Fragment>
            )
        }
    ),
    {
        type: "QuxMainInput"
    }
);


let Q_QuxA;
let Q_QuxB;
let Q_QuxC;
let Q_QuxD;
let Q_QuxE;
let Q_QuxF;

describe("FKSelector", function () {

    let format;
    let inputSchema;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        inputSchema.schema.genericTypes = [
            {
                "type": "InteractiveQueryQuxD",
                "typeParameters": [
                    "QuxD"
                ],
                "genericType": "de.quinscape.automaton.model.data.InteractiveQuery"
            },
            {
                "type": "InteractiveQueryQuxB",
                "typeParameters": [
                    "QuxB"
                ],
                "genericType": "de.quinscape.automaton.model.data.InteractiveQuery"
            },
            {
                "type": "InteractiveQueryQuxC",
                "typeParameters": [
                    "QuxC"
                ],
                "genericType": "de.quinscape.automaton.model.data.InteractiveQuery"
            },
            {
                "type": "InteractiveQueryQuxA",
                "typeParameters": [
                    "QuxA"
                ],
                "genericType": "de.quinscape.automaton.model.data.InteractiveQuery"
            },
            {
                "type": "InteractiveQueryQuxMain",
                "typeParameters": [
                    "QuxMain"
                ],
                "genericType": "de.quinscape.automaton.model.data.InteractiveQuery"
            }
        ];

        format = new WireFormat(inputSchema, {
            InteractiveQueryQuxA : InteractiveQuery,
            InteractiveQueryQuxB : InteractiveQuery,
            InteractiveQueryQuxC : InteractiveQuery,
            InteractiveQueryQuxD : InteractiveQuery
        }, {
            wrapAsObservable: true
        });

        Q_QuxA = createMockedQuery(format, "InteractiveQueryQuxA", require("./iquery-qux-a.json"));
        Q_QuxB = createMockedQuery(format, "InteractiveQueryQuxB", require("./iquery-qux-b.json"));
        Q_QuxC = createMockedQuery(format, "InteractiveQueryQuxC", require("./iquery-qux-c.json"));
        Q_QuxD = createMockedQuery(format, "InteractiveQueryQuxD", require("./iquery-qux-d.json"));
        Q_QuxE = createMockedQuery(format, "InteractiveQueryQuxD", require("./iquery-qux-e.json"));
        Q_QuxF = createMockedQuery(format, "InteractiveQueryQuxD", require("./iquery-qux-f.json"));

    });

    beforeEach(() => {

        executeSpy = sinon.spy();

        GraphQLQuery.prototype.execute = executeSpy;
    });

    it("selects foreign key targets", function (done) {

        const formObj = format.convert(
            {
                kind: "OBJECT",
                name: "QuxMain"
            },
            {
                "_type": "QuxMain",
                "name": "Qux Main #2",
                "id": "5b474f2a-88db-4ef8-84c2-4194a96f3365",
                "quxAId": "cd816e04-a7cf-4df8-aad9-f021907cd81c",
                "quxA": {
                    "_type": "QuxA",
                    "name": "Qux A #1",
                    "value": 1
                },
                "quxBName": null,
                "quxB": null,
                "quxCId1": "eb471c70-92e5-4ba5-84dc-e1b5c7f6ab3e",
                "quxC1": {
                    "_type": "QuxC",
                    "name": "Qux C #5",
                    "value": 5
                },
                "quxCId2": "68f58837-e74d-4355-a02a-30fb7606a281",
                "quxC2": {
                    "_type": "QuxC",
                    "name": "Qux C #6",
                    "value": 6
                },
                "quxD": null,
                "quxE": {
                    "_type": "QuxE",
                    "name": "Qux E #4",
                    "value": 4
                },
                "quxF": null,
            },
            true
        );

        let container, debug;

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={ formObj }
                            options={{isolation: false}}
                        />
                    </FormConfigProvider>
                ))
            }
        );


        const fkSelectorA = getByLabelText(container, "quxAId");
        assert(fkSelectorA.value === "Qux A #1");
        const fkSelectorB = getByLabelText(container, "quxBName");
        assert(fkSelectorB.value === "---");

        const fkSelectorC1 = getByLabelText(container, "quxCId1");
        assert(fkSelectorC1.value === "Qux C #5");
        const fkSelectorC2 = getByLabelText(container, "quxCId2");
        assert(fkSelectorC2.value === "Qux C #6");

        const fkSelectorD = getByLabelText(container, "quxD");
        assert(fkSelectorD.value === "---");
        const fkSelectorE = getByLabelText(container, "quxE");
        assert(fkSelectorE.value === "Qux E #4");
        const fkSelectorF = getByLabelText(container, "quxF");
        assert(fkSelectorF.value === "");


        selectFromModal(fkSelectorA, "Qux A #3")
            .then(() => {
                assert(fkSelectorA.value === "Qux A #3");
                // deep path not part of view model
                //assert(formObj.quxA.name === "Qux A #3")
            })
            .then(() => selectFromModal(fkSelectorB, "Qux B #1") )
            .then(() => {
                assert(fkSelectorB.value === "Qux B #1");
            })
            .then(() => selectFromModal(fkSelectorC1, "Qux C #1") )
            .then(() => {
                assert(fkSelectorC1.value === "Qux C #1");
            })
            .then(() => selectFromModal(fkSelectorC2, null) )
            .then(() => {
                assert(fkSelectorC2.value === "---");
            })
            .then(() => selectFromModal(fkSelectorD, "Qux D #2") )
            .then(() => {
                act(
                () => {

                    userEvent.type(fkSelectorE, "4");

                }
            )})
            .then(() => {

                // TODO: Test update behavior
                // console.log(
                //     prettyDOM(
                //         document.querySelectorAll(".global-errors")
                //     )
                // )

                //assert(fkSelectorE.value === "Qux E #4");
            })
            .then(() => {
                assert(fkSelectorD.value === "Qux D #2");
            })
            .then(() => {

                act(() => {
                    getByText(container, "Submit").click();
                });

                assert(formObj.quxA.name === "Qux A #3");
                assert(formObj.quxBName === "Qux B #1");
                assert(formObj.quxC1.name === "Qux C #1");
                assert(!formObj.quxC2);
                assert(formObj.quxD.name === "Qux D #2");


            })
            .then(done);

    });
});
