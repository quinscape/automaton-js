import { describe, it, beforeEach } from "mocha"
import React from "react"
import sinon from "sinon"
import assert from "power-assert"
import { act, getByLabelText, getByText, prettyDOM, render, fireEvent } from "@testing-library/react"
import { Field, Form, FormConfigProvider, FormContext, InputSchema, WireFormat } from "domainql-form"

import config from "../../src/config"
import { __setWireFormatForTest } from "../../src/domain";
import { observable } from "mobx";

import { AutomatonEnv } from "../../src/process/Process";
import BigNumber from "bignumber.js";

import Button from "../../src/ui/Button";
import userEvent from "@testing-library/user-event"
import DecimalField from "../../src/ui/DecimalField"
import { StartupRegistry } from "../../src/startup"
import ViewState from "../../src/process/ViewState";
import sleep from "./sleep"
class MockProcess
{
    constructor()
    {
        this.name = "TestProcess";
        this.currentState = new ViewState("TestState", () => {}, props => false)

        this.transitions = {
            "nonDiscard" : {
                to: "TestProcess",
                action: sinon.spy()
            },
            "nd2" : {
                to: "TestProcess",
                action: sinon.spy()
            },
            "nonform" : {
                discard: true,
                to: "TestProcess",
                action: sinon.spy()
            },
            "nonform2" : {
                to: "TestProcess",
                action: sinon.spy()
            },
            "discard" : {
                to: "TestProcess",
                discard: true,
                action: sinon.spy()
            }
        }
    }

    getTransition(name)
    {
        return this.transitions[name];
    }

    transition(name, context, button)
    {
        this.transitions[name].action(context, button);
    }
}


const TestForm = ({value, renderSpy, actionSpy}) => (
    <>
        <Form
            type="Garply"
            value={ value }
            options={{ isolation: false }}
        >
            {
                formConfig => {

                    renderSpy(formConfig);

                    return (
                        <>
                            <Field name="name"/>
                            <DecimalField name="name"/>
                            <DecimalField name="opt"/>

                            <Button
                                name="do-button"
                                transition="nonDiscard"
                            >
                                Do
                            </Button>
                            <Button
                                name="do-button-2"
                                transition="nd2"
                                context={ 387 }
                            >
                                Do2
                            </Button>
                            <Button
                                name="dont-button"
                                transition="discard"
                            >
                                Dont
                            </Button>
                            <Button
                                name="action"
                                action={ actionSpy }
                            >
                                Action
                            </Button>
                            <Button
                                name="action2"
                                action={ actionSpy }
                                disabled={ Button.disabledIfErrors }
                            >
                                ActionDiscard
                            </Button>
                        </>
                    )
                }
            }
        </Form>
        <Button
            name="non-form"
            transition="nonform"
        >
            Do3
        </Button>
        <Button
            name="non-form2"
            transition="nonform2"
            context={ "aaa" }
        >
            Do4
        </Button>
        <Button
            name="action-outside"
            action={ actionSpy }
        >
            Action Outside
        </Button>
    </>
)

const rawSchema = require("./button-test-schema.json")

describe("Button", function () {

    let inputSchema, wireFormat;

    beforeEach(
        () => {
            inputSchema = new InputSchema(rawSchema);

            config.inputSchema = inputSchema;

            new FormContext(inputSchema).useAsDefault();

            wireFormat = new WireFormat(
                inputSchema,
                {
                }
            )

            __setWireFormatForTest(wireFormat);

            StartupRegistry.registerBigDecimalConverter();
        }
    )



    it("invokes transitions with a context", () => {

        const mockProcess = new MockProcess();
        const mockEnv = {
            process: mockProcess
        };

        const formObj = observable({
            _type: "Garply",
            name: "Test Garply",
            value: new BigNumber("123.45"),
            opt: null
        })

        const renderSpy = sinon.spy();

        const result = render(
            <AutomatonEnv.Provider value={mockEnv}>
                <FormConfigProvider schema={inputSchema}>
                    <TestForm
                        value={formObj}
                        renderSpy={renderSpy}

                    />
                </FormConfigProvider>
            </AutomatonEnv.Provider>
        )
        const container = result.container;

        // non-discard button inside form
        {
            act(
                () => {
                    const button = getByText(container, "Do");
                    assert(!button.disabled);
                    button.click()
                }
            )
        }

        return FormContext.getDefault().waitForAsyncValidation()
            .then(() => sleep(5))
            .then(
                () => {

                    const transitionSpy = mockProcess.getTransition("nonDiscard").action;
                    assert(transitionSpy.called)
                    assert(transitionSpy.lastCall.args[0] === formObj)
                    assert(transitionSpy.lastCall.args[1] === "do-button")

                    // non-discard button inside form with explicit context
                    {

                        act(
                            () => {
                                const button = getByText(container, "Do2");
                                assert(!button.disabled);
                                button.click()
                            }
                        )
                    }

                    return FormContext.getDefault().waitForAsyncValidation()
                })
            .then(() => sleep(5))
            .then(
                () => {

                    const transitionSpy = mockProcess.getTransition("nd2").action;
                    assert(transitionSpy.called)
                    assert(transitionSpy.lastCall.args[0] === 387)
                    assert(transitionSpy.lastCall.args[1] === "do-button-2")

                    // button outside form (only works as discard)
                    {
                        act(
                            () => {
                                const button = getByText(container, "Do3");
                                assert(!button.disabled);
                                button.click()
                            }
                        )
                    }

                    return FormContext.getDefault().waitForAsyncValidation()
                }
            )
            .then(
                () => {

                    const transitionSpy = mockProcess.getTransition("nonform").action;
                    assert(transitionSpy.called)
                    assert(transitionSpy.lastCall.args[0] === null)
                    assert(transitionSpy.lastCall.args[1] === "non-form")

                    // button outside form with explicit context
                    {
                        act(
                            () => {
                                const button = getByText(container, "Do4");
                                assert(!button.disabled);
                                button.click()
                            }
                        )
                    }
                    return FormContext.getDefault().waitForAsyncValidation()
                }
            )
            .then(() => sleep(5))
            .then(
                () => {

                    const transitionSpy = mockProcess.getTransition("nonform2").action;
                    assert(transitionSpy.called)
                    assert(transitionSpy.lastCall.args[0] === "aaa")
                    assert(transitionSpy.lastCall.args[1] === "non-form2")

                    // check behavior on error
                    act(
                        () => {
                            const input = getByLabelText(container, "name");
                            fireEvent.change(input, {
                                target: {
                                    value: ""
                                }
                            });
                        }
                    )

                    assert(renderSpy.called);
                    const formConfig = renderSpy.lastCall.args[0];
                    assert.deepEqual(formConfig.getErrors("name"), ["", "[Field Required]"]);

                    const nonDiscardButton = getByText(container, "Do");
                    const nonDiscardButton2 = getByText(container, "Do2");
                    const discardButton = getByText(container, "Dont");
                    const actionButton = getByText(container, "Action");
                    const actionWithDisabledIfErrors = getByText(container, "ActionDiscard");

                    assert(nonDiscardButton.disabled);
                    assert(nonDiscardButton2.disabled);
                    assert(!discardButton.disabled);
                    assert(!actionButton.disabled);
                    assert(actionWithDisabledIfErrors.disabled);

                }
            )
    });


    it("handles null form objects", () => {

        const mockProcess = new MockProcess();
        const mockEnv = {
            process: mockProcess
        };
        
        let container;

        const renderSpy = sinon.spy();

        act(
            () => {
                const result = render(
                    <AutomatonEnv.Provider value={mockEnv}>
                        <FormConfigProvider schema={inputSchema}>
                            <TestForm
                                value={ null }
                                renderSpy={ renderSpy }

                            />
                        </FormConfigProvider>
                    </AutomatonEnv.Provider>
                )
               container = result.container;
            }
        )

        //console.log(prettyDOM(container))

        const input = getByLabelText(container, "name");
        const nonDiscardButton = getByText(container,"Do");
        const discardButton = getByText(container,"Dont");
        const nonFormButton = getByText(container,"Do3");
        const nonFormButton2 = getByText(container,"Do4");

        assert(input.disabled);
        assert(nonDiscardButton.disabled);
        assert(!discardButton.disabled);
        assert(!nonFormButton.disabled);
        assert(!nonFormButton2.disabled);

    });
});
