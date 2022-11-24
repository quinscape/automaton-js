import assert from "power-assert"
import sinon from "sinon"
import { act, cleanup, fireEvent, getAllByText, getByText, prettyDOM, render } from "@testing-library/react"

import React from "react"

import config from "../../../src/config"
import InteractiveQuery from "../../../src/model/InteractiveQuery"
import { FormConfigProvider, FormContext, InputSchema, WireFormat } from "domainql-form"
import Tree, { findParentLink } from "../../../src/ui/tree/Tree";
import { createMockedQuery } from "../../../src/util/createMockedQuery";
import matchCondition, { matchPlaceholder } from "../../matchCondition";
import { and, component, field } from "../../../src/FilterDSL";
import getTreeSummary from "./getTreeSummary";
import sleep from "../sleep";
import { __setWireFormatForTest } from "../../../src/domain";

const rawSchema = require("./tree-test-schema.json");
const nodeIndex = require("./node-index");

const allNodes = require("./iquery-node.json");

const firstNodes = {
    ...allNodes,
    rows: allNodes.rows.slice(0, 6)
};

let updateSpy;
let updateConditionSpy;

describe("Tree.IndexedObjects", function () {

    let format, inputSchema;

    afterEach(() => {
        cleanup();
    } );

    beforeEach(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;
        
        // XXX: tree cloning does not work as expected
        config.skipIndexTreeCloning = true;

        format = new WireFormat(inputSchema, {
            InteractiveQueryFoo: InteractiveQuery,
            InteractiveQueryNode: InteractiveQuery
        });

        new FormContext(inputSchema).useAsDefault();
        __setWireFormatForTest(format)

    });
    // beforeEach(() => {
    //
    // });

    it("organizes objects by initial", function () {

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
                    field("name").startsWith(
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

            return result;

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

        act(() => {
            const folderA = getByText(container, "A:");
            folderA.click();
            const folderB = getByText(container, "B:");
            folderB.click();
        });

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
            const moreButton = getByText(container, "[More]");
            moreButton.click();
        });

        return Promise.resolve().then(
            () => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // 6 more elements loaded
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " >E:",
                        " >F:"
                    ]
                );

                act(() => {
                    const fItems = getByText(container, "F:");
                    fItems.click();
                });

            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // loaded the elements under "F:"
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " >E:",
                        " vF:",
                        "    flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                        // XXX: Look! no [More]
                    ]
                );

                act(() => {
                    const eItems = getByText(container, "E:");
                    eItems.click();
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // loaded the 6 elements under "E:" not duplicating the 4 "F" elements already present
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        // XXX: overflow handled correctly
                        "    flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );

                act(() => {
                    const bItems = getByText(container, "B:");
                    bItems.click();
                });

            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // group "B:" closed
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " >B:",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        "    flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );

                queryCount = 0;

                act(() => {

                    // click on the caret button instead of the letter for second toggle
                    const bItems = container.querySelectorAll(".caret")[1];

                    bItems.click();
                });
            })

            .then(() => {

                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // group "B:" opened again
                    [
                        "*vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        "    flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );

                // closing and opening a node for which data is already loaded should not result in any more queries
                assert(queryCount === 0);


                act(() => {

                    // click on the caret button instead of the letter for second toggle
                    const flamingoButton = getByText(container, "flamingo");

                    findParentLink(flamingoButton).focus();
                });
            })

            .then(() => {


                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // group "B:" opened again
                    [
                        " vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
                        "    calf",
                        "    carp",
                        "    catfish",
                        "    cavy",
                        "    cheetah",
                        "    chicken",
                        "    [More]",
                        " >D:",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        "*   flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );

                act(() => {
                    const moreButton = getByText(container, "[More]");
                    moreButton.click();
                });

                return sleep(5);
            })

            .then(() => {
                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // group "B:" opened again
                    [
                        " vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
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
                        " >D:",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        "*   flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );
            })

            .then(() => {
                act(() => {
                    const dItems = getByText(container, "D:");
                    dItems.click();
                });
            })

            .then(() => {


                const summary = getTreeSummary(container);

                //console.log(JSON.stringify(summary, null, 4));

                assert.deepEqual(
                    summary,
                    // group "B:" opened again
                    [
                        " vA:",
                        "    aardvark",
                        "    antelope",
                        " vB:",
                        "    bass",
                        "    bear",
                        "    boar",
                        "    buffalo",
                        " vC:",
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
                        " vD:",
                        "    deer",
                        "    [More]",
                        " vE:",
                        "    elephant",
                        "    Escherichia Coli",
                        " vF:",
                        "*   flamingo",
                        "    flea",
                        "    frog",
                        "    fruitbat"
                    ]
                );


            })
    });
});
