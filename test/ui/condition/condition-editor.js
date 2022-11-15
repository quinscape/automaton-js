import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, render, getByText, getByLabelText, queryByText, prettyDOM } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { observable } from "mobx"

import React from "react"

import config from "../../../src/config"
import { FormConfigProvider, FormContext, InputSchema, WireFormat } from "domainql-form"
import ConditionEditor from "../../../src/ui/condition/ConditionEditor"
import { __setWireFormatForTest } from "../../../src/domain";
import { field, value, toJSON, and } from "../../../src/FilterDSL";
import clearAndType from "../../util/clearAndType";
import sleep from "../sleep";
import { findContextMenu, invokeContextMenu } from "./helper";


const rawSchema = require("./condition-editor-schema.json");

let updateSpy;
let updateConditionSpy;



describe("ConditionEditor", function () {

    let inputSchema;
    let format;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        new FormContext(inputSchema).useAsDefault()

        format = new WireFormat(inputSchema, {}, {
            wrapAsObservable: true
        });

        __setWireFormatForTest(format);
    });

    it("edits FilterDSL condition graphs", function () {

        let container, debug;

        const scope = observable({
            condition: toJSON(
                field("name").contains(value("aaa"))
            )
        })

        const result = render(
            <FormConfigProvider schema={inputSchema}>
                <ConditionEditor
                    key={scope.counter}
                    rootType="Foo"
                    container={scope}
                    queryCondition={scope.condition}
                    path="condition"
                />
            </FormConfigProvider>
        )

        container = result.container;

        return sleep(5)
            .then(() => {

                const fieldNameInput = getByLabelText(container, "Field name");
                assert(fieldNameInput.value === "name")
                assert(scope.condition.operands[0].name === "name")

                clearAndType(fieldNameInput, "num", {delay: 1})

            })
            .then(() => sleep(10))
            .then(() => {
                const fieldNameInput = getByLabelText(container, "Field name");
                assert(fieldNameInput.value === "num")
                assert(scope.condition.operands[0].name === "num")

                // changing the field to an integer field changes the associated scalarType to "Int"
                assert(scope.condition.operands[1].scalarType === "Int")
                // and produces an error because the value is still "aaa" but the type of the field is now "Int"
                assert(!!getByText(container, "[Invalid Integer]"))
                assert(scope.condition.operands[1].value === "aaa")

                const fieldValueInput = getByLabelText(container, "[Filter value]");
                assert(fieldValueInput.value === "aaa")

                clearAndType(fieldValueInput, "12", {delay: 1})
            })
            .then(() => sleep(5))
            .then(() => {
                assert(scope.condition.operands[1].value === 12)
                assert(!queryByText(container, "[Invalid Integer]"))

                const conditionSelect = getByLabelText(container,"[condition]");

                userEvent.selectOptions(conditionSelect, ["eq"])

            })

            .then(() => sleep(5))
            .then(() => {

                assert(scope.condition.name === "eq")
            })

    })


    it("wraps nodes in logical conditions", function () {
        let container, debug;

        const scope = observable({
            condition: toJSON(
                field("name").contains(value("aaa"))
            )
        })

        const result = render(
            <FormConfigProvider schema={inputSchema}>
                <ConditionEditor
                    key={scope.counter}
                    rootType="Foo"
                    container={scope}
                    queryCondition={scope.condition}
                    path="condition"
                />
            </FormConfigProvider>
        )

        container = result.container;

        return sleep(5)
            .then(() => {

                return invokeContextMenu(container, scope.condition, "[Wrap AND]")
            })
            .then(
                () => {
                    assert.deepEqual(
                        scope.condition,
                        {
                            "type": "Condition",
                            "name": "and",
                            "operands": [
                                {
                                    "type": "Condition",
                                    "name": "contains",
                                    "operands": [
                                        {
                                            "type": "Field",
                                            "name": "name"
                                        },
                                        {
                                            "type": "Value",
                                            "scalarType": "String",
                                            "value": "aaa"
                                        }
                                    ]
                                },
                                {
                                    "type": "Condition",
                                    "name": "containsIgnoreCase",
                                    "operands": [
                                        {
                                            "type": "Field",
                                            "name": ""
                                        },
                                        {
                                            "type": "Value",
                                            "scalarType": "String",
                                            "value": ""
                                        }
                                    ]
                                }
                            ]
                        }
                    )
                }
            )

    })
    it("removes sub conditions and simplifies the condition", function () {
        let container, debug;

        const scope = observable({
            condition: toJSON(
                and(
                    field("name").contains(value("aaa")),
                    field("name").contains(value("bbb"))
                )
            )
        })

        const result = render(
            <FormConfigProvider schema={inputSchema}>
                <ConditionEditor
                    key={scope.counter}
                    rootType="Foo"
                    container={scope}
                    queryCondition={scope.condition}
                    path="condition"
                />
            </FormConfigProvider>
        )

        container = result.container;

        return sleep(5)
            .then(() => {

                return invokeContextMenu(container, scope.condition.operands[0], "[Remove]")
            })
            .then(
                () => {
                    assert.deepEqual(
                        scope.condition,
                        {
                            "name": "contains",
                            "operands": [
                                {
                                    "name": "name",
                                    "type": "Field"
                                },
                                {
                                    "scalarType": "String",
                                    "type": "Value",
                                    "value": "bbb"
                                }
                            ],
                            "type": "Condition"
                        }
                        )
                }
            )

    })
})
