import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, getAllByText, getByText, prettyDOM, render } from "@testing-library/react"

import React from "react"

import config from "../../../src/config"
import InteractiveQuery from "../../../src/model/InteractiveQuery"
import { FormConfigProvider, InputSchema, WireFormat } from "domainql-form"
import Tree from "../../../src/ui/tree/Tree";
import { createMockedQuery } from "../createMockedQuery";
import matchCondition, { matchPlaceholder } from "../../matchCondition";
import { and, component, field } from "../../../src/FilterDSL";
import getTreeSummary from "./getTreeSummary";
import { findContextMenuButton } from "./tree-objects";


const rawSchema = require("./tree-test-schema.json");
const nodeIndex = require("./node-index");

const allNodes = require("./iquery-node.json");

const firstNodes = {
    ...allNodes,
    rows: allNodes.rows.slice(0, 6)
};

let updateSpy;
let updateConditionSpy;

describe("Tree", function () {

    let format, inputSchema;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryFoo: InteractiveQuery,
            InteractiveQueryNode: InteractiveQuery
        });
    });
    // beforeEach(() => {
    //
    // });

    it("allows keyboard navigation", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryNode"
            },
            firstNodes,
            true
        );

        let queryCount = 0;

        iQuery._query = createMockedQuery(format, "InteractiveQueryNode", vars => {

            queryCount++;

            const {offset, condition} = vars.config;
            const letter = matchCondition(
                component(
                    "tree",
                    field("name").greaterThan(
                        matchPlaceholder("letter", "String")
                    )
                ),
                condition
            ).letter.value;

            //console.log("FILTER ", {letter, offset})

            // XXX: our filter emulation here cannot deal with emojis correctly, so our test data does not
            //      contain them. Emojis work fine in production where the Database does the sorting/filtering
            const filtered = allNodes.rows.filter(row => row.name.toLocaleUpperCase() > letter);

            const result = {
                ...allNodes,
                rows: filtered.slice(offset, offset + 6),
                rowCount: filtered.length
            };

            //console.log(result)

            return {result};

        });

        const defaultActionSpy = sinon.spy();
        const extraActionSpy = sinon.spy();

        const {container, debug} = render(
            <FormConfigProvider schema={inputSchema}>
                <Tree>
                    <Tree.IndexedObjects
                        values={iQuery}
                        render={foo => foo.name}
                        index={nodeIndex}
                        renderIndex={c => c + ":"}
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

        const summary = getTreeSummary(container);

        //console.log(JSON.stringify(summary, null, 4));

        assert.deepEqual(
            summary,
            // default tree with 6 injected elements
            [
                "*vA:",
                "    aardvark",
                "    antelope",
                " vB:",
                "    bass",
                "    bear",
                "    boar",
                "    buffalo",
                "    [More]",
                " >C:",
                " >D:",
                " >E:",
                " >F:"
            ]
        );

        act(() => {
            const firstItem = container.querySelector("li[role='treeitem']");
            firstItem.focus();

            fireEvent(
                firstItem,
                new KeyboardEvent("keydown", {

                    bubbles: true,
                    cancelable: true,
                    // end
                    keyCode: 35
                })
            );
        });

        // Dummy promise chain in which each then executes its function on the
        // next "tick" / after all currently queued call-backs are executed. ( alternative to setImmediate cascade)
        return Promise.resolve().then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // selection moved to end
                    [
                        " vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        "*>F:"
                    ]
                );

                act(() => {
                    const firstItem = container.querySelector("li[role='treeitem']");
                    firstItem.focus();

                    fireEvent(
                        firstItem,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // up
                            keyCode: 38
                        })
                    );
                });
            })
            .then(() => {
                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // selection moved to second to last
                    [
                        " vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        "*>E:",
                        " >F:"
                    ]
                );
                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // pos1
                            keyCode: 36
                        })
                    );
                });
            })
            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // selection moved down
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // down
                            keyCode: 40
                        })
                    );
                });
            })
            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // selection moved down
                    [
                        " vA:",
                        "*   aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // left
                            keyCode: 37
                        })
                    );
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // aardvark has no children, selection moved to parent
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // left again
                            keyCode: 37
                        })
                    );
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // aardvark has no children, selection moved to parent
                    [
                        "*>A:",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // right
                            keyCode: 39
                        })
                    );
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // "A:" opened again
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // right again
                            keyCode: 39
                        })
                    );
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // "A:" was open, jumped to first child
                    [
                        " vA:",
                        "*   aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    [More]",
                        " >C:",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // return
                            keyCode: 13
                        })
                    );
                });
            })

            .then(() => {

                assert(defaultActionSpy.called);

                assert.deepEqual(defaultActionSpy.args[0], [
                    {
                        "_type": "Node",
                        "id": "e67fef00-5940-4449-9913-df9a00973c1b",
                        "name": "aardvark",
                        "parent": {
                            "_type": "Node",
                            "id": null,
                            "name": "Mammal"
                        },
                        "type": 2
                    }
                ]);

                act(() => {
                    fireEvent(
                        document.activeElement,
                        new KeyboardEvent("keydown", {

                            bubbles: true,
                            cancelable: true,
                            // return
                            keyCode: 13,
                            ctrlKey: true
                        })
                    );
                });
            })
            .then(() => {

                act(() => {
                    const extraMenu = findContextMenuButton(container, "Extra");
                    extraMenu.click();
                });

            })
            .then(() => {

                assert(extraActionSpy.called);

                assert.deepEqual(extraActionSpy.args[0], [
                    {
                        "_type": "Node",
                        "id": "e67fef00-5940-4449-9913-df9a00973c1b",
                        "name": "aardvark",
                        "parent": {
                            "_type": "Node",
                            "id": null,
                            "name": "Mammal"
                        },
                        "type": 2
                    }
                ]);

            });
        });
});
