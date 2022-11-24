import React from "react"
import sinon from "sinon"
import assert from "power-assert"
import userEvent from "@testing-library/user-event";
import { observer as fnObserver } from "mobx-react-lite"
import {
    act,
    cleanup,
    findByDisplayValue,
    findByText,
    fireEvent,
    getByLabelText,
    getByText,
    queryByLabelText,
    render,
    waitFor,
    waitForElementToBeRemoved,
    prettyDOM
} from "@testing-library/react"
import { FormConfigProvider, FormContext, InputSchema, WireFormat, withForm } from "domainql-form"

import config from "../../../src/config"
import InteractiveQuery from "../../../src/model/InteractiveQuery"
import FKSelector from "../../../src/ui/FKSelector";
import GraphQLQuery from "../../../src/GraphQLQuery"
import { __setWireFormatForTest } from "../../../src/domain";
import CachedQuery from "../../../src/model/CachedQuery";
import { field, value, or } from "../../../src/FilterDSL";

import sleep from "../sleep";
import { runInAction, toJS } from "mobx";
import ColumnState from "./typeDefinitions/ColumnState";
import QueryConfig from "./typeDefinitions/QueryConfig";
import QuxData from "./typeDefinitions/QuxData";


const rawSchema = require("./fk-selector-schema.json");

let executeSpy;

const searchTimeout = 4


function getModal()
{
    const modal = document.querySelector(".modal");
    if (modal != null) {
        return modal;
    }
    throw new Error("modal not found");
}

function openFKSelectorModal(fkSelector)
{
    const button = fkSelector.parentNode.querySelector("button");

    act(
        () => {
            button.click();
        }
    );

    return waitFor(() => getModal()).then(

        () => {

            return getModal();
        }
    );
}


function toText(element)
{
    if (element.nodeType === Node.TEXT_NODE)
    {
        //console.log("PRINT", element.textContent)
        return (element.textContent);
    }

    //console.log("PRINT", "<"+ element.tagName+ ">")

    if (element.tagName === "P")
    {
        element = element.firstChild;
    }

    switch (element.tagName)
    {
        case "I":
            if (element.classList.contains("fa-check"))
            {
                return ("V");
            }
            if (element.classList.contains("fa-bolt"))
            {
                return ("X");
            }

            break;
        case "LABEL":
            if (!element.classList.contains("sr-only"))
            {
                return ("/" + element.innerHTML + "/")
            }
            break;
        case "INPUT":
            if (element.readOnly || element.disable)
            {
                return ("'" + element.getAttribute("value") + "'")
            }
            else
            {
                return ("<[" + element.getAttribute("value") + "]>")
            }

        case "DIV":
        case "BUTTON":
        {
            let current = element.firstChild;
            const buf = [];
            while (current)
            {
                buf.push(
                    toText(current)
                )
                current = current.nextSibling;
            }
            return (buf.join(" "))
        }
        default:
            return (element.textContent)
    }

}


function getModalTableSummary()
{
    return "\n" + [ ... getModal().querySelectorAll("tr.data")]
        .map(row => {
            let curr = row.firstChild;

            let l = [];
            while ( curr)
            {
                l.push(toText(curr));
                curr = curr.nextSibling;
            }

            return l.join("|")
        })
        .join("\n") + "\n";
}


function clickModalChoice(modal, text)
{
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
}

function waitForModalClose()
{
    return waitForElementToBeRemoved(() => document.querySelector(".modal"));
}


function selectFromModal(fkSelector, text)
{
    //console.log("fkSelector", prettyDOM(fkSelector.parentNode))

    return openFKSelectorModal(fkSelector)
        .then(modal => clickModalChoice(modal, text))
        .then(() => waitForModalClose())
}


function createTestForm(type = "QuxMain")
{
    return withForm(
        fnObserver(
            props => {

                const {formConfig, children, renderSpy} = props;

                const {root} = formConfig;

                if (typeof renderSpy === "function")
                {
                    renderSpy(formConfig);
                }

                return (
                    <React.Fragment>
                        {children}
                        <button type="submit">Submit</button>

                    </React.Fragment>
                )
            }
        ),
        {
            type
        }
    )

}


function searchFor(inputElem, searchTerm)
{
    return Promise.resolve()
        .then(
            () => {

                return act(
                    () => {
                        inputElem.setSelectionRange(0, inputElem.value.length)
                        return userEvent.type(inputElem, searchTerm, {delay: searchTimeout / 2});

                    }
                )
            }
        )
        .then(
            () => sleep(searchTimeout * 2)
        )
}


function ignoreLeading(text)
{
    return text.replace(/^[ ]*/mg, "")
}


describe("FKSelector", function () {

    afterEach(() => {
        cleanup();

        document.body.innerHTML = "";
    });

    let format;
    let inputSchema;
    let formObj;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        new FormContext(inputSchema).useAsDefault()

        format = new WireFormat(inputSchema, {
            InteractiveQueryQuxA: InteractiveQuery,
            InteractiveQueryQuxB: InteractiveQuery,
            InteractiveQueryQuxC: InteractiveQuery,
            InteractiveQueryQuxD: InteractiveQuery,
            InteractiveQueryQuxE: InteractiveQuery,
            ColumnState: ColumnState,
            QueryConfig: QueryConfig,
            QuxA: QuxData,
            QuxB: QuxData,
            QuxC: QuxData,
            QuxD: QuxData,
            QuxE: QuxData
        }, {
            wrapAsObservable: true
        });

        __setWireFormatForTest(format);
    });

    beforeEach(() => {
        
        executeSpy = sinon.spy();

        GraphQLQuery.prototype.execute = executeSpy;

        formObj = format.convert(
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

                quxD: null,
                quxDId: null,

                quxD2: null,
                quxD2Id: null,

                quxD3: null,
                quxD3Id: null,

                quxD4: null,
                quxD4Id: null
            },
            true
        );

    });

    it("selects foreign key targets", function () {

        let container, debug;
        let changeSpy = sinon.spy();


        const Q_QuxA = CachedQuery.loadMemoryQuery("InteractiveQueryQuxA", require("./iquery-qux-a.json"), require("./Q_QuxA").default, {pageSize: 5});
        const Q_QuxB = CachedQuery.loadMemoryQuery("InteractiveQueryQuxB", require("./iquery-qux-b.json"), require("./Q_QuxB").default, {pageSize: 5});

        const TestForm = createTestForm();

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={formObj}
                        >
                            <FKSelector
                                name="quxAId"
                                display="quxA.name"
                                required={ true }
                                query={Q_QuxA}
                                fade={ false }
                                onChange={ changeSpy }
                            />

                            <FKSelector
                                name="quxBName"
                                query={Q_QuxB}
                                fade={ false }
                            />

                        </TestForm>
                    </FormConfigProvider>
                ))
            }
        );

        //console.log(prettyDOM(container))

        const fkSelectorA = getByLabelText(container, "quxAId");
        assert(fkSelectorA.value === "Qux A #1");

        const fkSelectorB = getByLabelText(container, "quxBName");
        assert(fkSelectorB.value === "---");

        return selectFromModal(fkSelectorA, "Qux A #3")
            .then(() => {
                assert(fkSelectorA.value === "Qux A #3");
                assert(formObj.quxA.name === "Qux A #3")

                const [ ctx, value ] = changeSpy.lastCall.args;

                assert(value === "17861d28-a11d-4dd5-b66c-b4351ca1a980")


                assert(ctx.fieldContext.isFieldContext)
                assert(ctx.fieldContext.qualifiedName === "quxAId")
                assert(ctx.oldValue === "cd816e04-a7cf-4df8-aad9-f021907cd81c")
                assert.deepEqual(ctx.oldRow, {
                    "_type": "QuxA",
                    "name": "Qux A #1",
                    "value": 1,
                    "description": undefined,
                    "id": undefined,
                })
                assert.deepEqual(ctx.row, {
                    "_type": "QuxA",
                    "name": "Qux A #3",
                    "description": "Desc Qux A #3",
                    "id": "17861d28-a11d-4dd5-b66c-b4351ca1a980",
                    "value": 3
                })

            })

    });

    it("handles multiple keys to the same target", function () {

        const Q_QuxC = CachedQuery.loadMemoryQuery("InteractiveQueryQuxC", require("./iquery-qux-c.json"), require("./Q_QuxC").default, {pageSize: 5});
        let container, debug;

        const TestForm = createTestForm();

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={formObj}
                        >
                            <FKSelector
                                name="quxCId1"
                                display="quxC1.name"
                                query={Q_QuxC}
                                fade={ false }
                            />

                            <FKSelector
                                name="quxCId2"
                                display="quxC2.name"
                                query={Q_QuxC}
                                fade={ false }
                            />

                        </TestForm>
                    </FormConfigProvider>
                ))
            }
        );

        //console.log(prettyDOM(container))

        const fkSelectorC1 = getByLabelText(container, "quxCId1");
        assert(fkSelectorC1.value === "Qux C #5");
        const fkSelectorC2 = getByLabelText(container, "quxCId2");
        assert(fkSelectorC2.value === "Qux C #6");

        return selectFromModal(fkSelectorC1, "Qux C #1")
            .then(() => {
                assert(fkSelectorC1.value === "Qux C #1");
                assert(formObj.quxC1.name === "Qux C #1")
                assert(formObj.quxCId1 === "1098633c-9260-4884-a952-03c122efe53b");
            })
            .then(() => selectFromModal(fkSelectorC2, null))
            .then(() => {
                assert(formObj.quxCId2 === null);
                assert(fkSelectorC2.value === "---");
            })
    });

    describe("Search Filter", () => {

        it.skip("accepts simple search filter", function () {

            const Q_QuxD = CachedQuery.loadMemoryQuery("InteractiveQueryQuxD", require("./iquery-qux-d.json"), require("./Q_QuxD").default, {pageSize: 5});
            let container, debug;

            let changeSpy = sinon.spy()

            const TestForm = createTestForm();

            act(
                () => {
                    ({container, debug} = render(
                        <FormConfigProvider schema={inputSchema}>
                            <TestForm
                                value={formObj}
                            >
                                <FKSelector
                                    name="quxDId"
                                    display="quxD.name"
                                    searchFilter="name"
                                    query={ Q_QuxD }
                                    fade={ false }
                                    searchTimeout={ searchTimeout }
                                    onChange={ changeSpy }
                                />

                            </TestForm>
                        </FormConfigProvider>
                    ))
                }
            );

            //console.log(prettyDOM(container))

            const fkSelectorD = getByLabelText(container, "quxDId");
            assert(fkSelectorD.value === "");

            // XXX: simple search gets transformed into the same complex expression, we do more thorough testing in
            //      "accepts complex search filter" 
            return Promise.resolve()
                .then(
                    () => searchFor(fkSelectorD, "#5")
                )
                .then(
                    () => findByDisplayValue(container, "Qux D #5")
                )

                .then(() => {
                    assert(formObj.quxDId === "3d1974f0-5ce0-4c9d-9cd9-b1d4cbd44cc7")
                    assert(formObj.quxD.name === "Qux D #5")

                    const [ ctx, value ] = changeSpy.lastCall.args;

                    assert(value === "3d1974f0-5ce0-4c9d-9cd9-b1d4cbd44cc7")


                    assert(ctx.fieldContext.isFieldContext)
                    assert(ctx.fieldContext.qualifiedName === "quxDId")
                    assert(ctx.oldValue === "")
                    assert(ctx.oldRow === null )
                    assert.deepEqual(ctx.row, {
                        "_type": "QuxD",
                        "description": "Desc Qux D #5",
                        "id": "3d1974f0-5ce0-4c9d-9cd9-b1d4cbd44cc7",
                        "name": "Qux D #5",
                        "value": 5
                    })

                })
        })

        it("accepts complex search filter", ()  => testQuxDWorkflow(false))


        it.skip("optionally hides the search filter in the modal", function () {

            const Q_QuxD = CachedQuery.loadMemoryQuery("InteractiveQueryQuxD", require("./iquery-qux-d.json"), require("./Q_QuxC").default, {pageSize: 5});
            let container, debug;

            const TestForm = createTestForm();

            act(
                () => {
                    ({container, debug} = render(
                        <FormConfigProvider schema={inputSchema}>
                            <TestForm
                                key={1}
                                value={formObj}
                            >
                                <FKSelector
                                    name="quxDId"
                                    display="quxD.name"
                                    searchFilter={
                                        val => or(
                                            field("name")
                                                .containsIgnoreCase(
                                                    value(
                                                        val
                                                    )
                                                ),
                                            field("description")
                                                .containsIgnoreCase(
                                                    value(
                                                        val
                                                    )
                                                )
                                        )
                                    }
                                    query={ Q_QuxD }
                                    fade={ false }
                                    modalFilter={ FKSelector.NO_SEARCH_FILTER }
                                    searchTimeout={ searchTimeout }
                                />

                            </TestForm>
                        </FormConfigProvider>
                    ))
                }
            );

            const fkSelectorD = getByLabelText(container, "quxDId");
            assert(fkSelectorD.value === "");

            return Promise.resolve()

                // check behavior on ambiguous matches
                .then(
                    () => searchFor(fkSelectorD, "#1")
                )
                .then(
                    // we match #1 and #11
                    () => findByText(container, "[Ambiguous match]")
                )
                .then(
                    () => openFKSelectorModal(fkSelectorD)
                )

                .then(modal => {

                    // without search filter there is no preselection (if we have a complex search filter)
                    assert(modal.querySelectorAll("tr.data").length === 5)

                    const searchFilterInput = queryByLabelText(modal, "search");
                    assert(!searchFilterInput)

                    clickModalChoice(modal, null)
                })
                .then(() => waitForModalClose())

                .then(() => {
                    act(
                        () => {
                            ({container, debug} = render(
                                <FormConfigProvider schema={inputSchema}>
                                    <TestForm
                                        key={ 2 }
                                        value={formObj}
                                    >
                                        <FKSelector
                                            name="quxDId"
                                            display="quxD.name"
                                            searchFilter="name"
                                            query={ Q_QuxD }
                                            fade={ false }
                                            modalFilter={ FKSelector.NO_SEARCH_FILTER }
                                            searchTimeout={ searchTimeout }
                                        />

                                    </TestForm>
                                </FormConfigProvider>
                            ))
                        }
                    );

                })

                // check behavior on ambiguous matches
                .then(
                    () => searchFor(getByLabelText(container, "quxDId"), "#1")
                )
                .then(
                    // we match #1 and #11
                    () => findByText(container, "[Ambiguous match]")
                )
                .then(
                    () => openFKSelectorModal(getByLabelText(container, "quxDId"))
                )

                .then(modal => {

                    // for a simple filter, we preselect via column filter
                    assert(modal.querySelectorAll("tr.data").length === 2)

                    const searchFilterInput = queryByLabelText(modal, "search");
                    assert(!searchFilterInput)

                    clickModalChoice(modal, null)
                })
                .then(() => waitForModalClose())

        })

        it("optionally adds an extra column filter in the modal", function () {

            const Q_QuxD = CachedQuery.loadMemoryQuery("InteractiveQueryQuxD", require("./iquery-qux-d.json"), require("./Q_QuxC").default, {pageSize: 5});
            let container, debug;

            const TestForm = createTestForm();

            act(
                () => {
                    ({container, debug} = render(
                        <FormConfigProvider schema={inputSchema}>
                            <TestForm
                                value={formObj}
                            >
                                <FKSelector
                                    name="quxDId"
                                    display="quxD.name"
                                    searchFilter="name"
                                    query={ Q_QuxD }
                                    fade={ false }
                                    modalFilter={ FKSelector.COLUMN_FILTER }
                                    searchTimeout={ searchTimeout }
                                />

                            </TestForm>
                        </FormConfigProvider>
                    ))
                }
            );

            const fkSelectorD = getByLabelText(container, "quxDId");
            assert(fkSelectorD.value === "");

            return Promise.resolve()

                .then(
                    () => openFKSelectorModal(fkSelectorD)
                )

                .then(modal => {

                        assert(modal.querySelectorAll("tr.filter input.form-control").length === 3)

                        const searchFilterInput = queryByLabelText(modal, "search");
                        assert(searchFilterInput.value === "")

                        return searchFor(searchFilterInput, "#1");
                    }
                )
                .then(
                    () => {

                        const summary = getModalTableSummary();
                        assert(
                            summary === ignoreLeading(`
                                [Select]|Qux D #1|1|Desc Qux D #1
                                [Select]|Qux D #11|9|Desc Qux D #9
                            `)
                        )
                        const filterRow = getModal().querySelector("tr.filter");
                        const filterInputs = filterRow.querySelectorAll("tr.filter input,select");

                        return searchFor(filterInputs[2], "#9");
                    }
                )
                .then(
                    () => {

                        const summary = getModalTableSummary();

                        assert(
                            summary === ignoreLeading(`
                                [Select]|Qux D #11|9|Desc Qux D #9
                            `)
                        )

                        const filterRow = getModal().querySelector("tr.filter");
                        const filterInputs = filterRow.querySelectorAll("tr.filter input,select");

                        return searchFor(filterInputs[2], "#2");
                    }
                )
                .then(
                    () => {

                        const summary = getModalTableSummary();

                        assert(
                            summary === ignoreLeading(`
                            
                            `)
                        )
                    }
                )
                .then(
                    () => clickModalChoice(getModal(), null)
                )
                .then(
                    () => waitForModalClose()
                )
        })

    })

    function testQuxDWorkflow(inMemory)
    {
        const rawData = require("./iquery-qux-d.json");
        const query = require("./Q_QuxD").default;

        const source = inMemory ?
            CachedQuery.convertIQuery(
                "InteractiveQueryQuxD",
                rawData,
                query
            ) :
            CachedQuery.loadMemoryQuery(
                "InteractiveQueryQuxD",
                rawData,
                query,
                {
                    pageSize: 5
                }
            );

        let container, debug;

        const renderSpy = sinon.spy();
        const TestForm = createTestForm();

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={formObj}
                            renderSpy={ renderSpy }
                        >
                            <FKSelector
                                name="quxDId"
                                display="quxD.name"
                                searchFilter="name"
                                query={ source }
                                fade={ false }
                                searchTimeout={ searchTimeout }
                            />

                        </TestForm>
                    </FormConfigProvider>
                ))
            }
        );

        const fkSelectorD = getByLabelText(container, "quxDId");
        assert(fkSelectorD.value === "");

        return Promise.resolve()


            // test normal selection on search filtered <FKSelector>
            .then(
                () => selectFromModal(fkSelectorD, "Qux D #2")
            )
            .then(() => {
                assert(formObj.quxDId === "a0434e65-9bad-47e1-8b28-04cf3523aa32")
                assert(formObj.quxD.name === "Qux D #2")
            })

            .then(
                () => searchFor(fkSelectorD, "#5")
            )
            .then(
                () => findByDisplayValue(container, "Qux D #5")
            )

            .then(() => {
                assert(formObj.quxDId === "3d1974f0-5ce0-4c9d-9cd9-b1d4cbd44cc7")
                assert(formObj.quxD.name === "Qux D #5")
            })


            // check behavior on ambiguous matches
            .then(
                () => searchFor(fkSelectorD, "#1")
            )
            .then(
                // we match #1 and #11
                () => findByText(container, "[Ambiguous match]")
            )
            .then(
                () => openFKSelectorModal(fkSelectorD)
            )

            .then(modal => {

                // ambiguous search filter preselects the same filter in the modal

                const tableBody = modal.querySelector("table.data-grid tbody")

                assert(modal.querySelectorAll("tr.data").length === 2)

                const searchFilterInput = getByLabelText(modal, "search");

                assert(searchFilterInput.value === "#1")

                assert(getByText(tableBody, "Qux D #1"))
                assert(getByText(tableBody, "Qux D #11"))

                // by default, we have no column filters if we have a search filter
                assert(!modal.querySelectorAll("tr.filter input.form-control").length)

                clickModalChoice(modal, null)


            })
            .then(() => waitForModalClose())


            .then(
                () => searchFor(fkSelectorD, "abc")
            )
            .then(
                () => findByText(container, "[No match]")
            )

    }

    it("works off in-memory queries", ()  => testQuxDWorkflow(true))

    it("tolerates non-null violations", function () {

        const Q_QuxA = CachedQuery.loadMemoryQuery("InteractiveQueryQuxA", require("./iquery-qux-a.json"), require("./Q_QuxA").default, {pageSize: 5});

        let container, debug;

        runInAction(
            () => {


                // this is a non-null violations but it happens all the time on new objects. We tolerate it in a form until
                // revalidation is triggered.
                formObj.quxAId = null;
                formObj.quxA = null;
            }
        )

        const renderSpy = sinon.spy();

        const TestForm = createTestForm();

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={formObj}
                            renderSpy={ renderSpy }
                        >
                            <FKSelector
                                name="quxAId"
                                display="quxA.name"
                                required={ true }
                                query={Q_QuxA}
                                fade={ false }
                            />

                        </TestForm>
                    </FormConfigProvider>
                ))
            }
        );

        const fkSelectorA = getByLabelText(container, "quxAId");

        return Promise.resolve()
            .then(
                () => {
                    assert(formObj.quxAId === null)
                    assert(formObj.quxA === null)

                    const formConfig = renderSpy.lastCall.args[0];
                    assert(!formConfig.hasErrors())
                }
            )
            .then(
                () => {
                    act(
                        () => {
                            fireEvent.click(getByText(container, "Submit"))
                        }
                    )

                }
            )
            .then(
                () => {
                    const formConfig = renderSpy.lastCall.args[0];
                    assert.deepEqual(formConfig.getErrors("quxAId"), ["","[Field Required]"])
                }
            )
            .then(
                () => selectFromModal(fkSelectorA, "Qux A #3")
            )
            .then(() => {
                assert(fkSelectorA.value === "Qux A #3");
                assert(formObj.quxA.name === "Qux A #3")
                assert(formObj.quxAId === "17861d28-a11d-4dd5-b66c-b4351ca1a980")

                const formConfig = renderSpy.lastCall.args[0];
                assert(!formConfig.hasErrors())
            })
    })

    it("works on intermediary objects", function () {

        let container, debug;

        const localFormObj = format.convert(
            {
                kind: "OBJECT",
                name: "QuxTop"
            },
            {
                "id": "22168310-5e9f-491a-b079-aedef1c199e4",
                "name": "Qux Top #5",
                "quxMid": {
                    "id": "85015f1d-1cca-4354-a580-9d9b76069188",
                    "name": "Qux Mid #5",
                    "quxEId": "1ce1ce45-504b-4e9a-b135-04f4a20380f5",
                    "quxE": {
                        "id": "1ce1ce45-504b-4e9a-b135-04f4a20380f5",
                        "name": "Qux E #9",
                        "value": 1009,
                        "description": "Qux E #9 Desc"
                    }
                }
            },
            true
        )

        const Q_QuxE = CachedQuery.loadMemoryQuery("InteractiveQueryQuxE", require("./iquery-qux-e.json"), require("./Q_QuxE").default, {pageSize: 5});

        const TestForm = createTestForm("QuxTop");

        act(
            () => {
                ({container, debug} = render(
                    <FormConfigProvider schema={inputSchema}>
                        <TestForm
                            value={ localFormObj }
                        >
                            <FKSelector
                                name="quxMid.quxEId"
                                display="quxMid.quxE.name"
                                query={ Q_QuxE }
                                fade={ false }
                            />

                        </TestForm>
                    </FormConfigProvider>
                ))
            }
        );

        //console.log(prettyDOM(container))

        const fkSelectorE = getByLabelText(container, "quxEId");
        assert(fkSelectorE.value === "Qux E #9");

        return selectFromModal(fkSelectorE, "Qux E #1")
            .then(() => {
                assert(localFormObj.quxMid.quxE.name === "Qux E #1")
                assert(localFormObj.quxMid.quxEId === "54a3d4dc-3cea-45d8-afec-3eff56cce851")
                assert(fkSelectorE.value === "Qux E #1");

                // double-check that we have not set the right fields in the wrong object
                assert(!localFormObj.quxEId)
                assert(!localFormObj.quxE)
            })
    })
});
