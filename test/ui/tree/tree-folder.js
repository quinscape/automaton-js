import assert from "power-assert"
import sinon from "sinon"
import { act, getByText, prettyDOM, render } from "@testing-library/react"

import React from "react"

import config from "../../../src/config"
import InteractiveQuery from "../../../src/model/InteractiveQuery"
import { FormConfigProvider, InputSchema, WireFormat } from "domainql-form"
import Tree from "../../../src/ui/tree/Tree";
import { createMockedQuery } from "../createMockedQuery";
import getTreeSummary from "./getTreeSummary";


const rawSchema = require("./tree-test-schema.json");

const allNodes = require("./iquery-node.json");


describe("Tree.Folder", function () {

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

    it("lazily queries tree objects", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryNode"
            },
            allNodes,
            true
        );

        iQuery._query = createMockedQuery(format, "InteractiveQueryNode", allNodes);

        const defaultActionSpy = sinon.spy();
        const extraActionSpy = sinon.spy();

        const {container, debug} = render(
            <FormConfigProvider schema={inputSchema}>
                <Tree>
                    <Tree.Folder
                        render={ () => "Test-Folder" }
                        query={ iQuery._query }
                        variables={{ config: {}}}
                    >
                        {
                            nodes => (
                                <Tree.Objects
                                    values={ nodes }
                                    render={ row => ( row.name )}
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
                            )
                        }
                    </Tree.Folder>
                </Tree>
            </FormConfigProvider>
        );

        const summary = getTreeSummary(container);

        //console.log(JSON.stringify(summary, null, 4));

        assert.deepEqual(
            summary,
            // default tree with closed folder
            [
                "*>Test-Folder"
            ]
        );

        act(() => {
            const folder = getByText(container, "Test-Folder");
            folder.click();
        });

        return Promise.resolve().then(
            () => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // tree with all values loaded
                    [
                        "*vTest-Folder",
                        "    aardvark",
                        "    antelope",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    chub",
                        "    clam",
                        "    crab",
                        "    crayfish",
                        "    crow",
                        "    deer",
                        "    dogfish",
                        "    dolphin",
                        "    dove",
                        "    duck",
                        "    elephant",
                        "    Escherichia Coli",
                        "    flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );

            })
    });

    it("can be invisible", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryNode"
            },
            allNodes,
            true
        );

        iQuery._query = createMockedQuery(format, "InteractiveQueryNode", allNodes);

        const defaultActionSpy = sinon.spy();
        const extraActionSpy = sinon.spy();

        const {container, debug} = render(
            <FormConfigProvider schema={inputSchema}>
                <Tree>
                    <Tree.Folder
                        query={ iQuery._query }
                        variables={{ config: {}}}
                    >
                        {
                            nodes => (
                                <Tree.Objects
                                    values={ nodes }
                                    render={ row => ( row.name )}
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
                            )
                        }
                    </Tree.Folder>
                </Tree>
            </FormConfigProvider>
        );


        return Promise.resolve().then(
            () => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // Invisible Folder queries contents immediately (and ensures there's a selection in case the folder
                    // was the only tree item before)
                    [
                        "* aardvark",
                        "  antelope",
                        "  bass",
                        "  bear",
                        "  boar",
                        "  buffalo",
                        "  calf",
                        "  carp",
                        "  catfish",
                        "  cavy",
                        "  cheetah",
                        "  chicken",
                        "  chub",
                        "  clam",
                        "  crab",
                        "  crayfish",
                        "  crow",
                        "  deer",
                        "  dogfish",
                        "  dolphin",
                        "  dove",
                        "  duck",
                        "  elephant",
                        "  Escherichia Coli",
                        "  flamingo",
                        "  flea",
                        "  frog",
                        "  fruitbat"
                    ]
                );
            })
    });
});