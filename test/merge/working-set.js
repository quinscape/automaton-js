import assert from "power-assert"
import { before, describe, it } from "mocha";
import rawSchema from "./working-set-schema.json"
import config from "../../src/config";
import InteractiveQuery from "../../src/model/InteractiveQuery";
import { InputSchema, WireFormat } from "domainql-form";
import { __setWireFormatForTest, registerAutomatonConverters } from "../../src/domain";
import { observable, runInAction } from "mobx";
import { DateTime } from "luxon";
import WorkingSet from "../../src/WorkingSet";
import printSchema from "../../src/util/printSchema";
import { INPUT_OBJECT, LIST } from "domainql-form/lib/kind";

/**
 * These tests test the generation of entity changes from observed changes with observable graphs
 */
describe.skip("WorkingSet", function () {

    let inputSchema, format;
    before(() => {
        inputSchema = new InputSchema(rawSchema);

        //console.log(printSchema(rawSchema));

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryCorge : InteractiveQuery
        });

        __setWireFormatForTest(format)

        registerAutomatonConverters();
    })


    function mockedWorkingSet(config, fn)
    {
        const workingSet = new WorkingSet(config);
        workingSet._mergeQuery.execute = ({mergeConfig, changes, deletions}) => {


            // XXX: we do a "to wire" conversion before comparison to be able to do a assert.deepEqual on graphs
            //      containing luxon dates
            const convertedChanges = format.convert(
                {
                    kind: LIST,
                    ofType: {
                        kind: INPUT_OBJECT,
                        name: "EntityChangeInput"
                    }
                },
                changes,
                false
            );
            const convertedDeletions = format.convert(
                {
                    kind: LIST,
                    ofType: {
                        kind: INPUT_OBJECT,
                        name: "EntityDeletionInput"
                    }
                },
                deletions,
                false
            );

            fn(
                convertedChanges,
                convertedDeletions
            );

            return Promise.resolve(
                {
                    // we pretend all merges worked fine
                    mergeWorkingSet: {
                        done: true,
                        conflicts: []
                    }
                }
            );
        }
        return workingSet;
    }


    it("tracks changes in objects", () => {

        const instance = observable({
            _type: "Corge",
            // DB column 'id'
            id: "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878",
            version: "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
            // DB column 'name'
            name: "Test Corge",
            // DB column 'num'
            num: 1000,
            num2: 2000,
            // Many-to-many objects from corge_link.corge_id
            corgeLinks: [],
            // DB column 'flag'
            flag: true,
            // DB column 'created'
            created: DateTime.fromISO("2020-09-01T12:00:40.151Z"),
            // DB column 'modified'
            modified: DateTime.fromISO("2020-09-01T14:10:40.210Z")
        })

        const workingSet = mockedWorkingSet({
            typeConfigs: [
                {
                    name: "Corge",
                    mergeGroups: [
                        {
                            fields: ["num", "num2"]
                        }
                    ],
                    ignored: ["modified"]
                }
            ]
        }, (changes, deletions) => {

            // XXX: those two are equivalent
            assert(workingSet.isModified(instance))
            assert(workingSet.isModified(instance._type, instance.id))

            assert.deepEqual(changes, [
                {
                    "id": {
                        "type": "String",
                        "value": "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878"
                    },
                    "version": "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
                    "type": "Corge",
                    "changes": [
                        // grouped field always reported together
                        {
                            "field": "num",
                            "value": {
                                "type": "Int",
                                "value": 1000
                            }
                        },
                        {
                            "field": "num2",
                            "value": {
                                "type": "Int",
                                "value": 1900
                            }
                        },
                        {
                            "field": "name",
                            "value": {
                                "type": "String",
                                "value": "Changed Name"
                            }
                        }
                    ],
                    "new": false
                }
            ])

            assert.deepEqual(
                deletions, []
            )

        });

        workingSet.registerBaseVersion(instance);

        // XXX: those two are equivalent
        assert(!workingSet.isModified(instance))
        assert(!workingSet.isModified(instance._type, instance.id))

        runInAction(() => {
            instance.name = "Changed Name";
            instance.num2 = 1900;
        })

        return workingSet.merge();
    });


    it("adds new objects", () => {

        const testUserId = "47250190-797c-4334-93e7-c59e0d4a19c2";
        const instance = observable({
            _type: "AppUser",
            id: testUserId,
            version: "d75ab084-80e1-4b49-acc2-90b6bc3d925b",
            // Many-to-many objects from baz.owner_id
            bazes : [],
            // DB column 'created'
            created: DateTime.fromISO("2020-09-01T12:00:40.151Z"),
            // DB column 'disabled'
            disabled : false,
            // Many-to-many objects from foo.owner_id
            foos : [],
            // DB column 'last_login'
            lastLogin : DateTime.fromISO("2020-10-01T12:00:40.151Z"),
            // DB column 'login'
            login : "test-user",
            // DB column 'password'
            password : "---",
            // DB column 'roles'
            roles : "ROLE_USER"
        });

        const newBazId = "3c0e7350-219e-4c70-8874-750f715c5695";
        const workingSet = mockedWorkingSet({
            typeConfigs: [
                {
                    name: "Corge",
                    mergeGroups: [
                        {
                            fields: ["num", "num2"]
                        }
                    ],
                    ignored: ["modified"]
                }
            ]
        }, (changes, deletions) => {


            //console.log(JSON.stringify(changes, null, 4));

            assert.deepEqual(changes, [
                    {
                        "id": {
                            "type": "String",
                            "value": newBazId
                        },
                        "version": null,
                        "type": "Baz",
                        "changes": [
                            {
                                "field": "name",
                                "value": {
                                    "type": "String",
                                    "value": "Test Baz"
                                }
                            },
                            {
                                "field": "id",
                                "value": {
                                    "type": "String",
                                    "value": newBazId
                                }
                            },
                            {
                                "field": "ownerId",
                                "value": {
                                    "type": "String",
                                    "value": testUserId
                                }
                            }
                        ],
                        "new": true
                    }
                ]
            )

            assert.deepEqual(
                deletions, []
            )

        });

        workingSet.registerBaseVersion(instance);

        runInAction(() => {
            const newBaz = {
                _type : "Baz",
                id: newBazId,
                // Many-to-many objects from baz_link.baz_id
                bazLinks: [],
                // DB column 'id'
                // DB column 'name'
                name: "Test Baz",
                // Target of 'owner_id'
                owner: inputSchema.clone(instance),
                // DB foreign key column 'owner_id'
                ownerId: instance.id
            };

            workingSet.addNew(newBaz);

            instance.bazes.push(
                newBaz
            );
        });

        return workingSet.merge();
    });


    it("handles many-to-many relations", () => {

        const corgeId = "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878";
        const instance = observable({
            _type: "Corge",
            // DB column 'id'
            id: corgeId,
            version: "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
            // DB column 'name'
            name: "Test Corge",
            // DB column 'num'
            num: 1000,
            num2: 2000,
            // Many-to-many objects from corge_link.corge_id
            corgeLinks: [],
            // DB column 'flag'
            flag: true,
            // DB column 'created'
            created: DateTime.fromISO("2020-09-01T12:00:40.151Z"),
            // DB column 'modified'
            modified: DateTime.fromISO("2020-09-01T14:10:40.210Z")
        })

        const assocId = "5aed6f07-cab8-433b-b4bb-2733e7f64dec"
        const corgeLinkId = "8e6c6506-e39e-4101-a3fd-de5eb6a017b9";
        const corgeLinkVersion = "913984ed-b1a3-425a-8a6e-3581fd20bf94";
        const assocVersion = "853351f4-f224-437e-979a-967ad5ad0ffe";

        const workingSet = mockedWorkingSet({
            typeConfigs: [
                {
                    name: "Corge",
                    mergeGroups: [
                        {
                            fields: ["num", "num2"]
                        }
                    ],
                    ignored: ["modified"]
                }
            ]
        }, (changes, deletions) => {

            //console.log(JSON.stringify(changes, null, 4));
            assert(workingSet.isModified(instance))


            assert.deepEqual(changes, [
                    {
                        "id": {
                            "type": "String",
                            "value": corgeLinkId
                        },
                        "version": corgeLinkVersion,
                        "type": "CorgeLink",
                        "changes": [
                            {
                                "field": "id",
                                "value": {
                                    "type": "String",
                                    "value": corgeLinkId
                                }
                            },
                            {
                                "field": "corgeId",
                                "value": {
                                    "type": "String",
                                    "value": corgeId
                                }
                            },
                            {
                                "field": "assocId",
                                "value": {
                                    "type": "String",
                                    "value": assocId
                                }
                            }
                        ],
                        "new": true
                    },
                    {
                        "id": {
                            "type": "String",
                            "value": corgeId
                        },
                        "version": "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
                        "type": "Corge",
                        "changes": [
                            {
                                "field": "corgeLinks",
                                "value": {
                                    "type": "[DomainObject]",
                                    "value": [
                                        {
                                            "_type": "CorgeAssoc",
                                            "id": assocId,
                                            "version": assocVersion,
                                            "name": "Corge Assoc #23",
                                            "num": 23
                                        }
                                    ]
                                }
                            }
                        ],
                        "new": false
                    }
                ]
            )

            assert.deepEqual(
                deletions, []
            )

        });

        workingSet.registerBaseVersion(instance);

        assert(!workingSet.isModified(instance))


        runInAction(() => {

            instance.corgeLinks.push({
                _type: "CorgeLink",
                id: corgeLinkId,
                version: corgeLinkVersion,

                // DB foreign key column 'assoc_id'
                assocId,

                // Target of 'assoc_id'
                assoc: {
                    _type: "CorgeAssoc",
                    id: assocId,
                    version: assocVersion,
                    // DB column 'name'
                    name: "Corge Assoc #23",
                    // DB column 'num'
                    num: 23
                },
                corgeId
            })
        })

        return workingSet.merge();
    });
    it("handles deleting many-to-many relations", () => {

        const assocId = "5aed6f07-cab8-433b-b4bb-2733e7f64dec"
        const corgeLinkId = "8e6c6506-e39e-4101-a3fd-de5eb6a017b9";
        const corgeLinkVersion = "913984ed-b1a3-425a-8a6e-3581fd20bf94";
        const assocVersion = "853351f4-f224-437e-979a-967ad5ad0ffe";

        const corgeId = "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878";
        const instance = observable({
            _type: "Corge",
            // DB column 'id'
            id: corgeId,
            version: "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
            // DB column 'name'
            name: "Test Corge",
            // DB column 'num'
            num: 1000,
            num2: 2000,
            // Many-to-many objects from corge_link.corge_id
            corgeLinks: [{
                _type: "CorgeLink",
                id: corgeLinkId,
                version: corgeLinkVersion,

                // DB foreign key column 'assoc_id'
                assocId,

                // Target of 'assoc_id'
                assoc: {
                    _type: "CorgeAssoc",
                    id: assocId,
                    version: assocVersion,
                    // DB column 'name'
                    name: "Corge Assoc #23",
                    // DB column 'num'
                    num: 23
                },
                corgeId
            }],
            // DB column 'flag'
            flag: true,
            // DB column 'created'
            created: DateTime.fromISO("2020-09-01T12:00:40.151Z"),
            // DB column 'modified'
            modified: DateTime.fromISO("2020-09-01T14:10:40.210Z")
        })

        const workingSet = mockedWorkingSet({
            typeConfigs: [
                {
                    name: "Corge",
                    mergeGroups: [
                        {
                            fields: ["num", "num2"]
                        }
                    ],
                    ignored: ["modified"]
                }
            ]
        }, (changes, deletions) => {

            // console.log(JSON.stringify(changes, null, 4));
            // console.log(JSON.stringify(deletions, null, 4));

            assert(workingSet.isModified(instance))

            assert.deepEqual(changes, [
                    {
                        "changes": [
                            {
                                "field": "corgeLinks",
                                "value": {
                                    "type": "[DomainObject]",
                                    "value": []
                                }
                            }
                        ],
                        "new": false,
                        "id": {
                            "type": "String",
                            "value": "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878"
                        },
                        "type": "Corge",
                        "version": "93cb71c7-8a7b-4fc5-a18b-199ae392486f"
                    }
                ]
            )

            assert.deepEqual(
                deletions, [
                    {
                        "type": "CorgeLink",
                        "version": "913984ed-b1a3-425a-8a6e-3581fd20bf94",
                        "id": {
                            "type": "String",
                            "value": "8e6c6506-e39e-4101-a3fd-de5eb6a017b9"
                        }
                    }
                ]

            )

        });

        workingSet.registerBaseVersion(instance);

        assert(!workingSet.isModified(instance))


        runInAction(() => {

            workingSet.markDeleted(instance.corgeLinks[0])

            instance.corgeLinks = [];
        })

        return workingSet.merge();
    });

    it("handles many-to-many relations on new objects", () => {

        const corgeId = "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878";
        const assocId = "5aed6f07-cab8-433b-b4bb-2733e7f64dec"
        const corgeLinkId = "8e6c6506-e39e-4101-a3fd-de5eb6a017b9";
        const corgeLinkVersion = "913984ed-b1a3-425a-8a6e-3581fd20bf94";
        const assocVersion = "853351f4-f224-437e-979a-967ad5ad0ffe";

        let instance;

        const workingSet = mockedWorkingSet({
            typeConfigs: [
                {
                    name: "Corge",
                    mergeGroups: [
                        {
                            fields: ["num", "num2"]
                        }
                    ],
                    ignored: ["modified"]
                }
            ]
        }, (changes, deletions) => {

            //console.log(JSON.stringify(changes, null, 4));

            assert.deepEqual(changes, [
                    {
                        "changes": [
                            {
                                "field": "num",
                                "value": {
                                    "type": "Int",
                                    "value": 1000
                                }
                            },
                            {
                                "field": "num2",
                                "value": {
                                    "type": "Int",
                                    "value": 2000
                                }
                            },
                            {
                                "field": "flag",
                                "value": {
                                    "type": "Boolean",
                                    "value": true
                                }
                            },
                            {
                                "field": "created",
                                "value": {
                                    "type": "Timestamp",
                                    "value": "2020-09-01T12:00:40.151Z"
                                }
                            },
                            {
                                "field": "name",
                                "value": {
                                    "type": "String",
                                    "value": "Test Corge"
                                }
                            },
                            {
                                "field": "modified",
                                "value": {
                                    "type": "Timestamp",
                                    "value": "2020-09-01T14:10:40.210Z"
                                }
                            },
                            {
                                "field": "id",
                                "value": {
                                    "type": "String",
                                    "value": "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878"
                                }
                            },
                            {
                                "field": "corgeLinks",
                                "value": {
                                    "type": "[DomainObject]",
                                    "value": [
                                        {
                                            "name": "Corge Assoc #23",
                                            "id": "5aed6f07-cab8-433b-b4bb-2733e7f64dec",
                                            "version": "853351f4-f224-437e-979a-967ad5ad0ffe",
                                            "num": 23,
                                            "_type": "CorgeAssoc"
                                        }
                                    ]
                                }
                            }
                        ],
                        "new": true,
                        "id": {
                            "type": "String",
                            "value": "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878"
                        },
                        "type": "Corge",
                        "version": "93cb71c7-8a7b-4fc5-a18b-199ae392486f"
                    },
                    {
                        "changes": [
                            {
                                "field": "id",
                                "value": {
                                    "type": "String",
                                    "value": "8e6c6506-e39e-4101-a3fd-de5eb6a017b9"
                                }
                            },
                            {
                                "field": "corgeId",
                                "value": {
                                    "type": "String",
                                    "value": "1df03525-e3d0-4d7a-90d6-e1f4e0fc3878"
                                }
                            },
                            {
                                "field": "assocId",
                                "value": {
                                    "type": "String",
                                    "value": "5aed6f07-cab8-433b-b4bb-2733e7f64dec"
                                }
                            }
                        ],
                        "new": true,
                        "id": {
                            "type": "String",
                            "value": "8e6c6506-e39e-4101-a3fd-de5eb6a017b9"
                        },
                        "type": "CorgeLink",
                        "version": "913984ed-b1a3-425a-8a6e-3581fd20bf94"
                    }
                ]
            )

            assert.deepEqual(
                deletions, []
            )

        });


        runInAction(() => {

            instance = observable({
                _type: "Corge",
                // DB column 'id'
                id: corgeId,
                version: "93cb71c7-8a7b-4fc5-a18b-199ae392486f",
                // DB column 'name'
                name: "Test Corge",
                // DB column 'num'
                num: 1000,
                num2: 2000,
                // Many-to-many objects from corge_link.corge_id
                corgeLinks: [{
                    _type: "CorgeLink",
                    id: corgeLinkId,
                    version: corgeLinkVersion,

                    // DB foreign key column 'assoc_id'
                    assocId,

                    // Target of 'assoc_id'
                    assoc: {
                        _type: "CorgeAssoc",
                        id: assocId,
                        version: assocVersion,
                        // DB column 'name'
                        name: "Corge Assoc #23",
                        // DB column 'num'
                        num: 23
                    },
                    corgeId
                }],
                // DB column 'flag'
                flag: true,
                // DB column 'created'
                created: DateTime.fromISO("2020-09-01T12:00:40.151Z"),
                // DB column 'modified'
                modified: DateTime.fromISO("2020-09-01T14:10:40.210Z")
            })

            workingSet.addNew(instance)

            // We consider new instances as modified, too
            assert(workingSet.isModified(instance))

        })

        return workingSet.merge();
    });
});
