import { describe, it, beforeEach } from "mocha"
import React from "react"
import assert from "power-assert"
import { act, getByText, render } from "@testing-library/react"
import { Field, Form, FormConfigProvider, FormContext, InputSchema, WireFormat } from "domainql-form"

import config from "../../src/config"
import InteractiveQuery from "../../src/model/InteractiveQuery"
import { createFilteredMockQuery } from "../../src/util/createMockedQuery";
import { __setWireFormatForTest } from "../../src/domain";
import { observable } from "mobx";
import { AssociationSelector } from "../../src";
import sleep from "./sleep";


const rawSchema = require("./association-selector-schema.json");


function isCheckedInTable(text)
{
    return getCheckbox(text).checked;
}


function getCheckbox(text)
{
    const modal = document.body.querySelector(".modal-body");

    const elem = getByText(modal, text);

    assert(elem.tagName === "P");
    assert(elem.parentNode.tagName === "TD");

    const checkbox = elem.parentNode.parentNode.querySelector("input[type='checkbox']");
    return checkbox;
}


function toggleSelection(text)
{
    const checkbox = getCheckbox(text);
    checkbox.click();
}


describe("AssociationSelector", function () {


    let inputSchema, wireFormat, formObj, Q_BazValueList;

    beforeEach(
        () => {
            inputSchema = new InputSchema(rawSchema);

            config.inputSchema = inputSchema;

            new FormContext(inputSchema).useAsDefault()

            wireFormat = new WireFormat(
                inputSchema,
                {
                    InteractiveQueryBaz: InteractiveQuery,
                    InteractiveQueryBazValue: InteractiveQuery
                }
            )

            __setWireFormatForTest(wireFormat);

            formObj = observable({
                _type: "Baz",
                id: "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                name: "Test Baz",
                bazLinks: [
                    {
                        "id": "73894504-f5d5-4522-b041-c92761d5a037",
                        "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                        "valueId": "cf6269ac-b81c-4ff8-ba96-1b1353131ded",
                        "value" : {
                            "id":"cf6269ac-b81c-4ff8-ba96-1b1353131ded",
                            "name":"Baz Value #1"
                        }
                    },
                    {
                        "id": "4c449f6f-2ad9-4b71-8d57-da0770da9126",
                        "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                        "valueId": "c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                        "value" : {
                            "id":"c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                            "name":"Baz Value #66"
                        }
                    }
                ]
            })

            Q_BazValueList = createFilteredMockQuery(wireFormat, "InteractiveQueryBazValue", require("./iquery-baz-value.json"));
        }

    )


    it("select associations for a many-to-many relation", () => {

        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        const wireFormat = new WireFormat(
            inputSchema,
            {
                InteractiveQueryBaz: InteractiveQuery,
                InteractiveQueryBazValue: InteractiveQuery
            }
        )

        __setWireFormatForTest(wireFormat);

        let container, debug;

        act(
            () => {

                const result = render(
                    <FormConfigProvider schema={inputSchema}>
                        <Form
                            type="Baz"
                            value={ formObj }
                            options={{ isolation: false }}
                        >
                            <Field name="name"/>
                            <AssociationSelector
                                name="bazLinks"
                                label="Associated Values"
                                display="value.name"
                                value="value.id"
                                helpText="Select associated baz values"
                                query={
                                    Q_BazValueList
                                }
                            />
                        </Form>
                    </FormConfigProvider>
                )

                container = result.container;
            }
        );


        const item1 = getByText(container, "Baz Value #1");
        const item2 = getByText(container, "Baz Value #66");

        assert(item1.tagName === "LI");
        assert(item2.tagName === "LI");

        act(
            () => {
                const button = getByText(container, "Select");
                button.click();
            }
        )

        // wait for modal to open
        return sleep(5)
            .then (
                () => {
                    //console.log(prettyDOM(document.body))

                    assert(isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(!isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    // XXX: we select an element from the second page to test the special handling of non-paged elements
                    act(
                        () => {
                            const button = getByText(document.body, "[Next]");
                            button.click();
                        }
                    )
                }
            )                     
            .then (
                () => {

                    assert(!isCheckedInTable("Baz Value #5"));
                    assert(isCheckedInTable("Baz Value #66"));
                    assert(!isCheckedInTable("Baz Value #7"));
                    assert(!isCheckedInTable("Baz Value #9"));

                    act(
                        () => toggleSelection("Baz Value #9")
                    )
                }
            )
            .then (
                () => {

                    assert(!isCheckedInTable("Baz Value #5"));
                    assert(isCheckedInTable("Baz Value #66"));
                    assert(!isCheckedInTable("Baz Value #7"));
                    assert(isCheckedInTable("Baz Value #9"));

                    // XXX: Now we go back
                    act(
                        () => {
                            const button = getByText(document.body, "[Prev]");
                            button.click();
                        }
                    )
                }
            )
            .then (
                () => {
                    // back to page one, nothing changed
                    assert(isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(!isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            toggleSelection("Baz Value #1")
                            toggleSelection("Baz Value #2")
                        }
                    )
                }
            )
            .then (
                () => {
                    assert(!isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            // close modal
                            const button = getByText(document.body, "[Close]");
                            button.click();
                        }
                    )
                }
            )
            .then (
                () => {

                    //console.log(JSON.stringify(formObj, null, 4));

                    assert.deepEqual(
                        formObj.bazLinks,
                        [
                            {
                                "id": "4c449f6f-2ad9-4b71-8d57-da0770da9126",
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                                "value": {
                                    "id": "c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                                    "name": "Baz Value #66"
                                }
                            },
                            {
                                "_type": "BazLink",
                                "id": formObj.bazLinks[1].id,
                                "value": {
                                    "_type": "BazValue",
                                    "name": "Baz Value #9",
                                    "id": "210e203f-48bf-45a6-ab7f-e0a8975c6cf1"
                                },
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "210e203f-48bf-45a6-ab7f-e0a8975c6cf1"
                            },
                            {
                                "_type": "BazLink",
                                "id": formObj.bazLinks[2].id,
                                "value": {
                                    "_type": "BazValue",
                                    "name": "Baz Value #2",
                                    "id": "c9b56f67-cffb-4749-a57d-9da81896ee31"
                                },
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "c9b56f67-cffb-4749-a57d-9da81896ee31"
                            }
                        ]
                    )
                }
            )
            .then(
                () => {
                    act(
                        () => {
                            const button = getByText(container, "Select");
                            button.click();
                        }
                    )
                }

            )
            .then(
                () => {
                    assert(!isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            toggleSelection("Baz Value #1")
                            toggleSelection("Baz Value #4")
                        }
                    )
                }
            )
            .then(
                () => {
                    assert(isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            // close modal
                            const button = getByText(document.body, "[Unselect All]");
                            button.click();
                        }
                    )
                }
            )
            .then (
                () => {
                    assert(!isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(!isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            // close modal
                            const button = getByText(document.body, "[Close]");
                            button.click();
                        }
                    )
                }
            )
            .then (
                () => {

                    //console.log(JSON.stringify(formObj, null, 4));

                    assert(!formObj.bazLinks.length)

                }
            )

    });

    it("allows customizing new associations", () => {



        let container, debug;

        act(
            () => {

                const result = render(
                    <FormConfigProvider schema={inputSchema}>
                        <Form
                            type="Baz"
                            value={ formObj }
                            options={{ isolation: false }}
                        >
                            <Field name="name"/>
                            <AssociationSelector
                                name="bazLinks"
                                label="Associated Values"
                                display="value.name"
                                value="value.id"
                                helpText="Select associated baz values"
                                onNew={ link => {
                                    link.org = "fcd4f82f-f5ba-469d-b337-05f95a9b6c84"
                                }}
                                query={
                                    Q_BazValueList
                                }
                            />
                        </Form>
                    </FormConfigProvider>
                )

                container = result.container;
            }
        );



        act(
            () => {
                const button = getByText(container, "Select");
                button.click();
            }
        )

        // wait for modal to open
        return sleep(5)
            .then (
                () => {
                    //console.log(prettyDOM(document.body))

                    assert(isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(!isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert(!isCheckedInTable("Baz Value #4"));

                    act(
                        () => toggleSelection("Baz Value #4")
                    )
                }
            )
            .then (
                () => {

                    assert(isCheckedInTable("Baz Value #1"));
                    assert(!isCheckedInTable("Baz Value #10"));
                    assert(!isCheckedInTable("Baz Value #2"));
                    assert(!isCheckedInTable("Baz Value #3"));
                    assert( isCheckedInTable("Baz Value #4"));

                    act(
                        () => {
                            // close modal
                            const button = getByText(document.body, "[Close]");
                            button.click();
                        }
                    )
                }
            )
            .then (
                () => {

                    //console.log(JSON.stringify(formObj, null, 4));

                    assert.deepEqual(
                        formObj.bazLinks,
                        [
                            {
                                "id": "73894504-f5d5-4522-b041-c92761d5a037",
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "cf6269ac-b81c-4ff8-ba96-1b1353131ded",
                                "value": {
                                    "id": "cf6269ac-b81c-4ff8-ba96-1b1353131ded",
                                    "name": "Baz Value #1"
                                }
                            },
                            {
                                "id": "4c449f6f-2ad9-4b71-8d57-da0770da9126",
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                                "value": {
                                    "id": "c5aa38f4-c02f-43da-bd49-2171be9ed06f",
                                    "name": "Baz Value #66"
                                }
                            },
                            {
                                "_type": "BazLink",
                                "id": formObj.bazLinks[2].id,
                                "value": {
                                    "_type": "BazValue",
                                    "name": "Baz Value #4",
                                    "id": "bf71a28c-deaf-43df-a523-f23de48d8913"
                                },
                                "bazId": "0b61a3b0-446c-4f69-8bd0-604271ba8bb9",
                                "valueId": "bf71a28c-deaf-43df-a523-f23de48d8913",
                                // XXX: set by onNew
                                "org": "fcd4f82f-f5ba-469d-b337-05f95a9b6c84"
                            }
                        ]
                    )
                }
            )

    });
});
