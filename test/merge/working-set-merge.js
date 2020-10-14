import assert from "power-assert"
import { before, describe, it } from "mocha";

import simpleMergeData from "./simple-merge.json"
import fkMergeData from "./foreign-key-merge.json"
import manyToManyMergeData from "./many-to-many.json"
import applyManyToManyInfoData from "./apply-many-to-many-info.json"
import rawSchema from "./merge-schema.json"
import config from "../../src/config";
import InteractiveQuery from "../../src/model/InteractiveQuery";
import { InputSchema, WireFormat } from "domainql-form";
import { __setWireFormatForTest } from "../../src/domain";
import { FieldStatus, FieldType, MergeOperation, RECURSE_EVERYTHING } from "../../src/ui/ChangeConflictDialog";
import { createResolution, loadScenario } from "./loadScenario";
import { toJS } from "mobx";


const TEST_CASE_ID = "20bbb666-79d1-4a50-8b23-4442be8b615e";

/**
 * These tests test the interaction of the working set and merge dialog outcomes. It mocks the GraphQL execution and
 * the merge dialog and draws data from the prepared JSON scenarios
 */
describe("WorkingSet Merge", function () {

    let inputSchema, format;
    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryCorge : InteractiveQuery
        });

        __setWireFormatForTest(format)
    })

    it("applies our field values", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(simpleMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                FieldStatus.OURS
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.description === "Description #12")
            assert(base.description === "Description #11")
        })

    });
    it("applies their field values", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(simpleMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                FieldStatus.THEIRS
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.description === "Description #11")
            assert(base.description === "Description #11")
        })

    });

    it("applies custom values", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(simpleMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                {
                    status: FieldStatus.VALUE,
                    value: {
                        type: "String",
                        value: "Description #13"
                    }
                }
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.description === "Description #13")
            assert(base.description === "Description #11")
        })

    });

    it("applies their foreign key selections", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(fkMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                [
                    FieldStatus.OURS,
                    {
                        status: FieldStatus.THEIRS,
                        fieldType: FieldType.FK_KEY
                    },
                    {
                        status: FieldStatus.THEIRS,
                        fieldType: FieldType.FK_OBJECT
                    }

                ]
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.typeId === "964d2966-7c30-4ffa-902e-54d8d7527ed8")
            assert(domainObject.type.name === "Type #2")

            assert(base.typeId === "964d2966-7c30-4ffa-902e-54d8d7527ed8")
            assert(base.type.name === "Type #2")
        })

    });

    it("applies our foreign key selections", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(fkMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                [
                    FieldStatus.OURS,
                    {
                        status: FieldStatus.OURS,
                        fieldType: FieldType.FK_KEY
                    },
                    {
                        status: FieldStatus.OURS,
                        fieldType: FieldType.FK_OBJECT
                    }

                ]
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.typeId === "1b4ed065-8f7d-46f2-a34a-599549cdb661")
            assert(domainObject.type.name === "Type #3")

            assert(base.typeId === "964d2966-7c30-4ffa-902e-54d8d7527ed8")
            assert(base.type.name === "Type #2")
        })

    });

    it("applies their many-to-many selections", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(manyToManyMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                [
                    FieldStatus.OURS,
                    {
                        status: FieldStatus.THEIRS,
                        fieldType: FieldType.MANY_TO_MANY
                    }

                ]
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.corgeLinks.length === 3)

            assert(domainObject.corgeLinks[0].id      === "4cc0d383-8708-41cf-af04-cfa1d8eb1656");
            assert(domainObject.corgeLinks[0].version === "8054f188-a286-4af4-886c-054c43bfe654");
            assert(domainObject.corgeLinks[0].assoc.name === "Assoc #4");

            assert(domainObject.corgeLinks[1].id      === "7c836876-1383-4896-9c7d-57ab6fbc41dc");
            assert(domainObject.corgeLinks[1].version === "b7d97c97-36c8-4498-ba16-8c25d754d807");
            assert(domainObject.corgeLinks[1].assoc.name === "Assoc #1");

            assert(domainObject.corgeLinks[2].id      === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
            assert(domainObject.corgeLinks[2].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
            assert(domainObject.corgeLinks[2].assoc.name === "Assoc #3");

            assert(base.corgeLinks[0].id      === "4cc0d383-8708-41cf-af04-cfa1d8eb1656");
            assert(base.corgeLinks[0].version === "8054f188-a286-4af4-886c-054c43bfe654");
            assert(base.corgeLinks[0].assoc.name === "Assoc #4");

            assert(base.corgeLinks[1].id      === "7c836876-1383-4896-9c7d-57ab6fbc41dc");
            assert(base.corgeLinks[1].version === "b7d97c97-36c8-4498-ba16-8c25d754d807");
            assert(base.corgeLinks[1].assoc.name === "Assoc #1");

            assert(base.corgeLinks[2].id      === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
            assert(base.corgeLinks[2].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
            assert(base.corgeLinks[2].assoc.name === "Assoc #3");
        })

    });

    it("applies our many-to-many selections", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(manyToManyMergeData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                [
                    FieldStatus.OURS,
                    {
                        status: FieldStatus.OURS,
                        fieldType: FieldType.MANY_TO_MANY
                    }

                ]
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            assert(domainObject.corgeLinks.length === 3)

            assert(domainObject.corgeLinks[0].id      === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
            assert(domainObject.corgeLinks[0].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
            assert(domainObject.corgeLinks[0].assoc.name === "Assoc #3");

            assert(domainObject.corgeLinks[1].id      === "14390c77-7e88-44e1-acc1-d6c16717011d");
            assert(domainObject.corgeLinks[1].version === undefined);
            assert(domainObject.corgeLinks[1].assoc.name === "Assoc #1");

            assert(domainObject.corgeLinks[2].id      === "34d6078d-a9f4-4523-955a-f19a058634fa");
            assert(domainObject.corgeLinks[2].version === undefined);
            assert(domainObject.corgeLinks[2].assoc.name === "Assoc #2");

            assert(base.corgeLinks[0].id      === "4cc0d383-8708-41cf-af04-cfa1d8eb1656");
            assert(base.corgeLinks[0].version === "8054f188-a286-4af4-886c-054c43bfe654");
            assert(base.corgeLinks[0].assoc.name === "Assoc #4");

            assert(base.corgeLinks[1].id      === "7c836876-1383-4896-9c7d-57ab6fbc41dc");
            assert(base.corgeLinks[1].version === "b7d97c97-36c8-4498-ba16-8c25d754d807");
            assert(base.corgeLinks[1].assoc.name === "Assoc #1");

            assert(base.corgeLinks[2].id      === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
            assert(base.corgeLinks[2].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
            assert(base.corgeLinks[2].assoc.name === "Assoc #3");

        })

    });

    it("applies informational many-to-many selections", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(applyManyToManyInfoData);

        //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


        nextResolution(
            createResolution(conflicts, [
                [
                    FieldStatus.OURS,
                    FieldStatus.OURS,
                    // we apply an informational many-to-many change 
                    {
                        status: FieldStatus.THEIRS,
                        fieldType: FieldType.MANY_TO_MANY
                    }

                ]
            ])
        )

        return workingSet.merge().then( () => {
            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);

            assert(domainObject.description === "Description #12")
            assert(domainObject.corgeLinks.length === 2)

            assert(domainObject.corgeLinks[0].id === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
            assert(domainObject.corgeLinks[0].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
            assert(domainObject.corgeLinks[0].assoc.name === "Assoc #3");
            assert(domainObject.corgeLinks[1].id === "2a347ec7-2eea-4fa8-955a-1a77c9471aed");
            assert(domainObject.corgeLinks[1].version === "17c0a637-5e1b-430a-8bcd-241eb6198f68");
            assert(domainObject.corgeLinks[1].assoc.name === "Assoc #1");

            {
                // 2nd test
                const { workingSet, nextResolution, conflicts } = loadScenario(applyManyToManyInfoData);

                //console.log("BEFORE",JSON.stringify(workingSet.lookup("Corge", TEST_CASE_ID).domainObject, null, 4))


                nextResolution(
                    createResolution(conflicts, [
                        [
                            FieldStatus.THEIRS,
                            FieldStatus.OURS,
                            // we apply an informational many-to-many change
                            {
                                status: FieldStatus.THEIRS,
                                fieldType: FieldType.MANY_TO_MANY
                            }

                        ]
                    ])
                )

                return workingSet.merge().then( () => {
                    const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);

                    assert(domainObject.description === "Description #11")
                    assert(domainObject.corgeLinks.length === 2)

                    assert(domainObject.corgeLinks[0].id === "ecfe1e62-a3a5-4ea1-b29a-55351b692100");
                    assert(domainObject.corgeLinks[0].version === "ae42e310-86e4-4006-abf6-9c311f52f8a5");
                    assert(domainObject.corgeLinks[0].assoc.name === "Assoc #3");
                    assert(domainObject.corgeLinks[1].id === "2a347ec7-2eea-4fa8-955a-1a77c9471aed");
                    assert(domainObject.corgeLinks[1].version === "17c0a637-5e1b-430a-8bcd-241eb6198f68");
                    assert(domainObject.corgeLinks[1].assoc.name === "Assoc #1");
                })
            }
        })
    });

    it("discards changes", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(applyManyToManyInfoData);

        nextResolution({
            operation: MergeOperation.DISCARD,
            resolutions: []
        })

        workingSet.merge().then(() => {

            const { domainObject } = workingSet.lookup("Corge", TEST_CASE_ID);
            const base = workingSet.lookupBase("Corge", TEST_CASE_ID);

            //console.log(toJS({domainObject,base}, RECURSE_EVERYTHING))

            assert.deepEqual(base, domainObject)

        })

    })

    it("cancels merge", function () {

        const { workingSet, nextResolution, conflicts } = loadScenario(applyManyToManyInfoData);

        const before = workingSet.toJS();

        nextResolution({
            operation: MergeOperation.CANCEL,
            resolutions: []
        })
        workingSet.merge().then(() => {

            // no changes at all to the working set
            assert.deepEqual(before, workingSet.toJS())
        })
    })
});
