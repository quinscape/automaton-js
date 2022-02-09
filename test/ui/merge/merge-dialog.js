import { before, describe, it } from "mocha"
import React from "react"
import assert from "power-assert"
import { act, getAllByText, getByLabelText, getByText, render, cleanup } from "@testing-library/react"

import simpleMergeData from "../../merge/simple-merge.json"
import fkMergeData from "../../merge/foreign-key-merge.json"
import manyToManyMergeData from "../../merge/many-to-many.json"
import rawSchema from "../../merge/merge-schema.json"
import config from "../../../src/config";
import InteractiveQuery from "../../../src/model/InteractiveQuery";
import { FormConfigProvider, FormContext, InputSchema, WireFormat } from "domainql-form";
import {
    __setWireFormatForTest,
    createGenericScalarFromWire,
    createGenericScalarToWire,
    registerAutomatonConverters
} from "../../../src/domain";
import ChangeConflictDialog, { FieldStatus, FieldType} from "../../../src/ui/ChangeConflictDialog";
import { loadScenario } from "../../merge/loadScenario";
import { renderImperativeDialogs } from "../../../src/ui/Dialog";
import { getTableSummary } from "./table-summary";
import userEvent from "@testing-library/user-event";
import sleep from "../sleep";
import { MergeOperation } from "../../../src/merge/MergeOperation";
import { openDialog } from "../../../src/util/openDialog"


const TEST_CASE_ID = "20bbb666-79d1-4a50-8b23-4442be8b615e";

describe.skip("<ChangeConflictDialog/>", function () {

    let inputSchema, wireFormat;

    afterEach(() => {
        cleanup();
    } );

    beforeEach(() => {

        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        wireFormat = new WireFormat(inputSchema, {
            InteractiveQueryCorge: InteractiveQuery
        });

        new FormContext(inputSchema).useAsDefault()

        wireFormat.registerConverter(
            "GenericScalar",
            createGenericScalarFromWire(wireFormat),
            createGenericScalarToWire(wireFormat)
        );

        __setWireFormatForTest(wireFormat)

        registerAutomatonConverters();

    })

    it("allows choice of our simple field values", function () {

        return runSimpeFieldTest(FieldStatus.OURS)
    })

    it("allows choice of their simple field values", function () {

        return runSimpeFieldTest(FieldStatus.THEIRS)
    })

    it("allows choice of custom values for simple fields", function () {

        return runSimpeFieldTest(FieldStatus.VALUE)
    })


    function renderScenario(rawData)
    {
        const {conflicts, workingSet} = loadScenario(rawData);

        let container, debug;

        const dialogPromise = openDialog(
            api => (
                <FormConfigProvider
                    schema={inputSchema}
                >
                    <ChangeConflictDialog
                        conflicts={conflicts}
                        config={ workingSet.mergeConfig }
                        dialog={api}
                        submitTimeOut={5}
                    />
                </FormConfigProvider>
            )
        )

        act(
            () => {
                ({container, debug} = render(
                    renderImperativeDialogs()
                ))
            }
        );
        return dialogPromise.then(
            result => {

                

                return result;
            }
        );
    }


    function runSimpeFieldTest(status)
    {
        const dialogPromise = renderScenario(simpleMergeData);

        //console.log(prettyDOM(document.querySelector(".modal")))


        const applyButton = getByText(document.body, "[Apply]");
        assert(applyButton.disabled)

        const summary = getTableSummary();
        //console.log(status, summary);

        assert.deepEqual(
            summary, `
[Status] | [Field]       | [Value]              | [Their Value]   | [Action]        |
---------+---------------+----------------------+-----------------+-----------------+
X        | [description] | <[Description #12]>  | Description #11 | [Ours] [Theirs] |
`
        )

        let expected, buttonState;

        switch (status)
        {
            case FieldStatus.OURS:
                expected = "Description #12";
                buttonState = "V [Ours] [Theirs]"
                break;

            case FieldStatus.THEIRS:
                expected = "Description #11";
                buttonState = "[Ours] V [Theirs]"
                break;

            case FieldStatus.VALUE:
                expected = "Description #13";
                buttonState = "[Ours] [Theirs]  "
                break;
        }

        //console.log(debug());

        if (status === FieldStatus.VALUE)
        {
            const descriptionInput = getByLabelText(document.body, "[description]");

            // act(
            //     () => {

                    descriptionInput.focus();
                    descriptionInput.setSelectionRange(0, descriptionInput.value.length)
                    userEvent.type(descriptionInput, expected);
            //     }
            // );

        }
        else
        {
            const oursButtons = getAllByText(document.body, status === FieldStatus.OURS ? "[Ours]" : "[Theirs]");

            act(
                () => {
                    oursButtons[0].click();
                }
            );
        }


        return (status === FieldStatus.VALUE ? sleep( 20) : Promise.resolve())
            .then(
                () => {

                    const summary = getTableSummary([0,0,0,0,17]);

                    //console.log(status, summary);

                    assert.deepEqual(
                        summary, `
[Status] | [Field]       | [Value]              | [Their Value]   | [Action]          |
---------+---------------+----------------------+-----------------+-------------------+
V        | [description] | <[${expected    }]>  | Description #11 | ${buttonState   } |
`
                    )

                    const applyButton = getByText(document.body, "[Apply]");
                    assert(!applyButton.disabled)

                    act(
                        () => applyButton.click()
                    );

                    // so now that we clicked on Apply our dialog promise will resolve
                    return dialogPromise;
                }
            )
            .then(
                ({ operation, resolutions } ) => {

                    //console.log("RESULT", JSON.stringify({operation, resolutions}, null, 4))

                    assert(operation === MergeOperation.APPLY);

                    assert(resolutions.length === 1)

                    const res = resolutions[0];

                    assert(res.type === "Corge")
                    assert(res.id.value === TEST_CASE_ID)
                    assert(res.version === "47057274-b97f-4488-afe5-d965a80c1179")
                    
                    assert(res.fields[0].name === "description")
                    assert(res.fields[0].value.value === expected)
                    assert(res.fields[0].status === status)
                    assert(res.fields[0].fieldType === FieldType.FIELD)
                    assert(res.fields[0].informational === false)

                    assert(res.fields[1].name === "modified")
                    assert(res.fields[1].value.value.toUTC().toISO() === "2020-06-26T21:26:47.137Z")
                    assert(res.fields[1].status === FieldStatus.OURS)
                    assert(res.fields[1].fieldType === FieldType.FIELD)
                    assert(res.fields[1].informational === true)

                    assert(res.fields.length === 2)
                }
            )
    }


    it("allows choice of our fk selection values", function () {

        return runFkTest(FieldStatus.OURS)
    })

    it("allows choice of their fk selection values", function () {

        return runFkTest(FieldStatus.THEIRS)
    })

    function runFkTest(status)
    {
        const dialogPromise = renderScenario(fkMergeData);

        //console.log(prettyDOM(document.querySelector(".modal")))


        const applyButton = getByText(document.body, "[Apply]");
        assert(applyButton.disabled)

        const summary = getTableSummary();
        //console.log(status, summary);

        assert.deepEqual(
            summary, `
[Status] | [Field] | [Value] | [Their Value] | [Action]        |
---------+---------+---------+---------------+-----------------+
X        | [type]  | Type #3 | Type #2       | [Ours] [Theirs] |
`
        )

        let expectedId, eNam, buttonState;
                                                                                                    
        switch (status)
        {
            case FieldStatus.OURS:
                expectedId = "1b4ed065-8f7d-46f2-a34a-599549cdb661";
                eNam = "Type #3";
                buttonState = "V [Ours] [Theirs]"
                break;

            case FieldStatus.THEIRS:
                expectedId = "964d2966-7c30-4ffa-902e-54d8d7527ed8";
                eNam = "Type #2";
                buttonState = "[Ours] V [Theirs]"
                break;
        }

        //console.log(debug());

        const oursButtons = getAllByText(document.body, status === FieldStatus.OURS ? "[Ours]" : "[Theirs]");

        act(
            () => {
                oursButtons[0].click();
            }
        );


        return Promise.resolve()
            .then(
                () => {

                    const summary = getTableSummary();

                    //console.log(status, summary);

                    assert.deepEqual(
                        summary, `
[Status] | [Field] | [Value] | [Their Value] | [Action]          |
---------+---------+---------+---------------+-------------------+
V        | [type]  | ${eNam} | Type #2       | ${ buttonState } |
`
                    )

                    const applyButton = getByText(document.body, "[Apply]");
                    assert(!applyButton.disabled)

                    act(
                        () => applyButton.click()
                    );

                    // so now that we clicked on Apply our dialog promise will resolve
                    return dialogPromise;
                }
            )
            .then(
                ({ operation, resolutions } ) => {

                    //console.log("RESULT", JSON.stringify({operation, resolutions}, null, 4))

                    assert(operation === MergeOperation.APPLY);

                    assert(resolutions.length === 1)

                    const res = resolutions[0];

                    assert(res.type === "Corge")
                    assert(res.id.value === TEST_CASE_ID)
                    assert(res.version === "0a89dba7-4450-49a0-8545-3890ffe41307")

                    assert(res.fields[0].name === "modified")
                    assert(res.fields[0].value.value.toUTC().toISO() === "2020-06-25T21:31:37.924Z")
                    assert(res.fields[0].status === FieldStatus.OURS)
                    assert(res.fields[0].fieldType === FieldType.FIELD)
                    assert(res.fields[0].informational === true)

                    assert(res.fields[1].value.value === expectedId)
                    assert(res.fields[1].status === status)
                    assert(res.fields[1].fieldType === FieldType.FK_KEY)
                    assert(res.fields[1].informational === false)

                    assert(res.fields[2].value.value.name === eNam)
                    assert(res.fields[2].status === status)
                    assert(res.fields[2].fieldType === FieldType.FK_OBJECT)
                    assert(res.fields[2].informational === false)


                    assert(res.fields.length === 3)
                }
            )
    }

    it("allows choice of our many-to-many selection values", function () {

        return runManyToManyTest(FieldStatus.OURS)
    })

    it("allows choice of their many-to-many selection values", function () {

        return runManyToManyTest(FieldStatus.THEIRS)
    })


    function runManyToManyTest(status)
    {
        const dialogPromise = renderScenario(manyToManyMergeData);

        //console.log(prettyDOM(document.querySelector(".modal")))


        const applyButton = getByText(document.body, "[Apply]");
        assert(applyButton.disabled)

        const summary = getTableSummary();
        //console.log(status, summary);

        assert.deepEqual(
            summary, `
[Status] | [Field]      | [Value]                  | [Their Value]            | [Action]        |
---------+--------------+--------------------------+--------------------------+-----------------+
X        | [corgeLinks] | Assoc #3Assoc #1Assoc #2 | Assoc #4Assoc #1Assoc #3 | [Ours] [Theirs] |
`
        )

        let expectedIds, expectedSelection, buttonState;

        switch (status)
        {
            case FieldStatus.OURS:
                expectedIds = [
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #3",
                        "description": null,
                        "id": "3a66eec3-2cea-4385-9205-c197e587b5c5",
                        "version": "851d8064-6564-4366-ac4c-f5d16b7d1b33",
                        "num": 1003
                    },
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #1",
                        "description": "Description #1",
                        "id": "269fe0b9-4d22-4f2d-adc4-541bc9f719b3",
                        "version": "98281330-e76a-4e6a-9696-c55e5d6121f8",
                        "num": 1001
                    },
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #2",
                        "description": "Description #2",
                        "id": "421869b0-5c98-448c-bd2f-2d1ecf002535",
                        "version": "f9fef6c2-d7e3-49ef-b570-98ec6fdc02d0",
                        "num": 1002
                    }
                ];
                expectedSelection = "Assoc #3Assoc #1Assoc #2";
                buttonState = "V [Ours] [Theirs]"
                break;

            case FieldStatus.THEIRS:
                expectedIds = [
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #4",
                        "description": null,
                        "id": "af086502-27c0-4a07-8d8b-07568ecbc448",
                        "version": "df49f6ec-2381-4e36-ace0-5898985a41a0",
                        "num": 1004
                    },
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #1",
                        "description": null,
                        "id": "269fe0b9-4d22-4f2d-adc4-541bc9f719b3",
                        "version": "98281330-e76a-4e6a-9696-c55e5d6121f8",
                        "num": 1001
                    },
                    {
                        "_type": "CorgeAssoc",
                        "name": "Assoc #3",
                        "description": null,
                        "id": "3a66eec3-2cea-4385-9205-c197e587b5c5",
                        "version": "851d8064-6564-4366-ac4c-f5d16b7d1b33",
                        "num": 1003
                    }
                ]
                ;
                expectedSelection = "Assoc #4Assoc #1Assoc #3";
                buttonState = "[Ours] V [Theirs]"
                break;
        }

        //console.log(debug());

        const oursButtons = getAllByText(document.body, status === FieldStatus.OURS ? "[Ours]" : "[Theirs]");

        act(
            () => {
                oursButtons[0].click();
            }
        );


        return Promise.resolve()
            .then(
                () => {

                    const summary = getTableSummary();

                    //console.log(status, summary);

                    assert.deepEqual(
                        summary, `
[Status] | [Field]      | [Value]                  | [Their Value]            | [Action]          |
---------+--------------+--------------------------+--------------------------+-------------------+
V        | [corgeLinks] | ${ expectedSelection } | Assoc #4Assoc #1Assoc #3 | ${ buttonState } |
`
                    )

                    const applyButton = getByText(document.body, "[Apply]");
                    assert(!applyButton.disabled)

                    act(
                        () => applyButton.click()
                    );

                    // so now that we clicked on Apply our dialog promise will resolve
                    return dialogPromise;
                }
            )
            .then(
                ({ operation, resolutions } ) => {

                    //console.log("RESULT", JSON.stringify({operation, resolutions}, null, 4))

                    assert(operation === MergeOperation.APPLY);

                    assert(resolutions.length === 1)

                    const res = resolutions[0];

                    assert(res.type === "Corge")
                    assert(res.id.value === TEST_CASE_ID)
                    assert(res.version === "1f245c77-e69b-4401-a452-2c17955cf331")

                    assert(res.fields[0].name === "modified")
                    assert(res.fields[0].value.value.toUTC().toISO() === "2020-06-26T11:21:06.883Z")
                    assert(res.fields[0].status === FieldStatus.OURS)
                    assert(res.fields[0].fieldType === FieldType.FIELD)
                    assert(res.fields[0].informational === true)

                    assert.deepEqual(res.fields[1].value.value , expectedIds )
                    assert(res.fields[1].status === status)
                    assert(res.fields[1].fieldType === FieldType.MANY_TO_MANY)
                    assert(res.fields[1].informational === false)


                    assert(res.fields.length === 2)
                }
            )
    }

    it("shows resolved/informational merge conflicts", function () {

        const dialogPromise = renderScenario(simpleMergeData);

        //console.log(prettyDOM(document.querySelector(".modal")))


        const informationalCheckbox = getByText(document.body, "[Show Informational]");
        assert(!informationalCheckbox.disabled)

        act(
            () => informationalCheckbox.click()
        )

        const summary = getTableSummary();

        //console.log(summary)

        assert.deepEqual(
            summary, `
[Status] | [Field]       | [Value]                     | [Their Value]          | [Action]          |
---------+---------------+-----------------------------+------------------------+-------------------+
X        | [description] | <[Description #12]>         | Description #11        | [Ours] [Theirs]   |
V        | [modified]    | <[26.6.2020 23:26:47.137]>  | 26.6.2020 23:26:41.803 | V [Ours] [Theirs] |
`
        )

        const cancelButton = getByText(document.body, "[Cancel]");

        act(
            () => cancelButton.click()
        );

        // so now that we clicked on Apply our dialog promise will resolve
        return dialogPromise;


    })
});
