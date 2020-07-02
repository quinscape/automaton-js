import WorkingSet, { convertConflicts } from "../../src/WorkingSet";
import { getWireFormat, MergeOperation } from "../../src";
import { FieldStatus } from "../../src/ui/ChangeConflictDialog";

import config from "../../src/config"
import { SCALAR } from "domainql-form/lib/kind";




/**
 * Rehydrates the given merge scenario from raw data.
 *
 * @param {object}  raw             raw data
 * @param {boolean} mockDialog      true if the merge dialog is be mocked with the value fed to nextResolution(), default is true
 * @return {{nextResolution: function, conflicts: Array<Object>, workingSet: WorkingSet}}   scenario API
 */
export function loadScenario(raw, mockDialog = true)
{
    const { conflicts: rawConflicts } = raw;

    let nextResolution = null;

    const api = {
        /**
         * Sets the next resolution the mocked openDialog will resolve to.
         *
         * @param {MergeResolution} r
         */
        nextResolution: r => {
            //console.log("NEXT RESOLUTION", JSON.stringify(r, null, 4))
            nextResolution = r;
        }
    };

    // Do lazy conversion on first property access for workingSet and conflicts
    let workingSet, conflicts;
    Object.defineProperty(api, "workingSet", {
        enumerable: false,
        configurable: false,
        get: () => {

            if (!workingSet)
            {
                //console.log("LAZILY CONVERT WORKING-SET")

                workingSet = WorkingSet.fromJS(raw.workingSet);

                workingSet._mergeQuery.execute = () => {
                    return Promise.resolve({mergeWorkingSet: {done: !conflicts.length, conflicts}});
                }

                if (mockDialog)
                {
                    workingSet._openDialog = () => {

                        const promise = Promise.resolve(nextResolution);

                        nextResolution = null;
                        return promise;
                    }
                }
            }

            return workingSet;
        }
    });

    Object.defineProperty(api, "conflicts", {
        enumerable: false,
        configurable: false,
        get: () => {

            if (!conflicts)
            {
                //console.log("LAZILY CONVERT CONFLICTS")

                conflicts = convertConflicts(rawConflicts, true);
            }
            return conflicts;
        }
    });

    return api
}


/**
 * Helper to create a merge resolution from a merge conflict
 *
 * @param {Array<MergeConflict>} conflicts                  array of conflicts
 * @param {String|object|Array<string|Object>} choices      choice string or MergeResolution field or array of choice strings or MergeResolution fields
 * @return {{resolutions: *, operation: string}}
 */
export function createResolution(conflicts, choices)
{
    choices = choices.map((choice, idx) => {
        if (Array.isArray(choice))
        {
            return choice;
        }
        {
            return new Array(conflicts[idx].fields.length).fill(choice);
        }
    })

    return {
        operation: MergeOperation.APPLY,
        resolutions: conflicts.map((c, conflictIndex) => ({
            _type: "MergeResolutionEntity",
            type: c.type,
            id: c.id,
            version: c.theirVersion,
            fields: c.fields.map((conflictField, fieldIndex) => {

                const choiceArray = choices[conflictIndex];

                const choice = choiceArray[fieldIndex];

                if (typeof choice === "object")
                {
                    return {
                        _type: "MergeResolutionField",
                            name: conflictField.name,
                        value: choice.status === FieldStatus.OURS ? conflictField.ours : conflictField.theirs,
                        ...choice
                    };
                }

                if (choice === FieldStatus.UNDECIDED || choice === FieldStatus.VALUE)
                {
                    throw new Error("Invalid simple resolution: " + choice);
                }

                return ({
                    _type: "MergeResolutionField",
                    name: conflictField.name,
                    value: choice === FieldStatus.OURS ? conflictField.ours : conflictField.theirs,
                    status: choice
                });
            })
        }))
    }
}
