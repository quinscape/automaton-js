import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, getAllByText, getByText, prettyDOM, render } from "@testing-library/react"

import React from "react"

import config from "../../../src/config"
import InteractiveQuery from "../../../src/model/InteractiveQuery"
import { FormConfigProvider, InputSchema, WireFormat } from "domainql-form"
import Tree from "../../../src/ui/tree/Tree";
import { createMockedQuery } from "../createMockedQuery";


const rawSchema = require("./tree-test-schema.json");
const rawFooQuery = require("../iquery-foo.json");

let updateSpy;
let updateConditionSpy;

export function findContextMenuButton(container, text)
{
    return getAllByText(container, text).filter( button => button.parentNode.getAttribute("aria-hidden") !== "true")[0];
}


describe("Tree.Objects", function () {

    let format, inputSchema;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryFoo : InteractiveQuery,
            InteractiveQueryNode : InteractiveQuery
        });
    });
    // beforeEach(() => {
    //
    // });

    it("offers user actions based on an iQuery", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryFoo"
            },
            rawFooQuery,
            true
        );

        iQuery._query = createMockedQuery(format, "InteractiveQueryFoo", require("../iquery-foo-more"));

        const defaultActionSpy = sinon.spy();
        const extraActionSpy = sinon.spy();


        const {container, debug} = render(
            <FormConfigProvider schema={ inputSchema }>
                <Tree>
                    <Tree.Objects
                        values={ iQuery }
                        render={ foo => foo.name + " - " + foo.description }
                        actions={
                            [
                                {
                                    label: "Open",
                                    action: defaultActionSpy
                                },
                                {
                                    label: "Extra",
                                    action: extraActionSpy
                                }
                            ]
                        }

                    />
                </Tree>
            </FormConfigProvider>
        );

        //debug()

        // we only check presence
        const foo1Button = getByText(container, "Foo #1 - desc");
        const foo2Button = getByText(container, "Foo #22 - xxx");
        const foo3Button = getByText(container, "Foo #33 - null");

        const foo4Button = getByText(container, "Foo #4 - xxx");
        const foo6Button = getByText(container, "Foo #6 -");
        const moreButton = getByText(container, "[More]");

        act(() => {
            foo6Button.click();
        });


        assert(defaultActionSpy.called)
        assert.deepEqual(defaultActionSpy.args[0], [
                {
                    "_type": "Foo",
                    "flag": true,
                    "name": "Foo #6",
                    "description": "",
                    "id": "51cb3a62-92a6-446d-94ae-5d5d844ea5b5",
                    "type": "TYPE_A",
                    "owner": {
                        "_type": "AppUser",
                        "id": "af432487-a1b1-4f99-96d4-3b8e9796c95a",
                        "login": "anonymous"
                    }
                }
            ]
        );

        act(() => {
            fireEvent(
                foo4Button,
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    ctrlKey: true
                })
            )
        });

        act(() => {
            const extraMenu = findContextMenuButton(container, "Extra");
            extraMenu.click();
        });


        assert(extraActionSpy.called);
        assert.deepEqual(extraActionSpy.args[0], [
                {
                    "_type": "Foo",
                    "id": "c3e89a90-b616-43c7-b6a0-0fe937898985",
                    "name": "Foo #4",
                    "description": "xxx",
                    "flag": true,
                    "type": "TYPE_D",
                    "owner": {
                        "_type": "AppUser",
                        "id": "af432487-a1b1-4f99-96d4-3b8e9796c95a",
                        "login": "anonymous"
                    }
                }
            ]
        );

        act(() => {
            moreButton.click();
        });

        return Promise.resolve().then(() => {

            const foo7Button = getByText(container, "Foo #7 - desc");
            const foo8Button = getByText(container, "Foo #8 - xxx");

            assert(foo7Button.type === "button");
            assert(foo7Button.getAttribute("type") === "button");

        });
    });

});
