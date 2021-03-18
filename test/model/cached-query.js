import assert from "power-assert"
import { describe, it, beforeEach } from "mocha"

import config from "../../src/config";
import { InputSchema, WireFormat } from "domainql-form";
import InteractiveQuery from "../../src/model/InteractiveQuery";
import { __setWireFormatForTest, getWireFormat } from "../../src/domain";
import { field, value } from "../../src/FilterDSL";
import CachedQuery from "../../src/model/CachedQuery";
import Q_QuxD_Injected from "./Q_QuxD_Injected";

const rawSchema = require("./cached-query-schema.json")
const rawQuxDQuery = require("./quxd-all.json")

describe("CachedQuery", function () {

    let source;

    beforeEach(
        () => {
            const inputSchema = new InputSchema(rawSchema);

            config.inputSchema = inputSchema;

            const wireFormat = new WireFormat(
                inputSchema,
                {
                    InteractiveQueryQuxD: InteractiveQuery
                }
            )
            __setWireFormatForTest(wireFormat);

            source = getWireFormat().fromWire( "InteractiveQueryQuxD", rawQuxDQuery);
            source._query = Q_QuxD_Injected;
        }
    )

    it("wraps sources iQueries", function () {

        const doc = new CachedQuery(source, {
            // XXX: we need to change the pageSize from 0
            pageSize: 5,
            sortFields: ["name"]
        })

        assert.deepEqual(
            doc.queryConfig,
            {
                "_type": "QueryConfig",
                "condition": null,
                "id": null,
                "offset": 0,
                "pageSize": 5,
                "sortFields": [
                    "name"
                ]
            }
        )

        // CachedQuery executed the default config and thus resorted by name with a pagination of 5
        assert.deepEqual(
            doc.rows.map(r => r.name),
            [
                "Qux D #1",
                "Qux D #11",
                "Qux D #2",
                "Qux D #3",
                "Qux D #4"
            ]
        )
    })

    it("paginates in-memory iQueries", function () {

        const doc = new CachedQuery(source, {
            // XXX: we need to change the pageSize from 0
            pageSize: 5,
            sortFields: ["name"]
        })

        // we go to the next page..
        doc.update(
            {
                offset: 5
            }
        )

        assert.deepEqual(
            doc.queryConfig,
            {
                "_type": "QueryConfig",
                "condition": null,
                "id": null,
                "offset": 5,
                "pageSize": 5,
                "sortFields": [
                    "name"
                ]
            }
        )

        // and find the rest of our rows
        assert.deepEqual(
            doc.rows.map(r => r.name),
            [
                "Qux D #5",
                "Qux D #6",
                "Qux D #7",
                "Qux D #8"
            ]
        )
    })

    it("sorts in-memory iQueries", function () {
        {
            const doc = new CachedQuery(source, {
                // XXX: we need to change the pageSize from 0
                pageSize: 5,
                sortFields: ["name"]
            })

            // back to page one, resort by value descending
            doc.update(
                {
                    sortFields: ["!value"]
                }
            )

            assert.deepEqual(
                doc.queryConfig,
                {
                    "_type": "QueryConfig",
                    "condition": null,
                    "id": null,
                    "offset": 0,
                    "pageSize": 5,
                    "sortFields": [
                        "!value"
                    ]
                }
            )

            assert.deepEqual(
                doc.rows.map(r => r.name),
                [
                    "Qux D #11",
                    "Qux D #8",
                    "Qux D #7",
                    "Qux D #6",
                    "Qux D #5"
                ]
            )
        }

        // test sorting for multiple columns
        {
            const doc = new CachedQuery(source, {
                // XXX: we need to change the pageSize from 0
                pageSize: 5,
                sortFields: ["name"]
            })

            // back to page one, resort by value descending
            doc.update(
                {
                    condition: field("description").eq(value("no desc")),
                    sortFields: ["description","!value"]
                }
            )

            assert.deepEqual(
                doc.queryConfig,
                {
                    "_type": "QueryConfig",
                    "condition": {
                        "type": "Condition",
                        "name": "eq",
                        "operands": [
                            {
                                "type": "Field",
                                "name": "description"
                            },
                            {
                                "type": "Value",
                                "scalarType": "String",
                                "value": "no desc",
                                "name": null
                            }
                        ]
                    },
                    "id": null,
                    "offset": 0,
                    "pageSize": 5,
                    "sortFields": [
                        "description",
                        "!value"
                    ]
                }
            )

            assert.deepEqual(
                doc.rows.map(r => r.name),
                [
                    "Qux D #3",
                    "Qux D #2"
                ]
            )
        }
    })

    it("filters in-memory iQueries", function () {

        const doc = new CachedQuery(source, {
            // XXX: we need to change the pageSize from 0
            pageSize: 5,
            sortFields: ["name"]
        })


        // filter by name
        doc.update(
            {
                condition: field("name").contains(value("#1"))
            }
        )

        assert.deepEqual(
            doc.queryConfig,
            {
                "_type": "QueryConfig",
                "pageSize": 5,
                "condition": {
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
                            "value": "#1",
                            "name": null
                        }
                    ]
                },
                "sortFields": [
                    "name"
                ],
                "id": null,
                "offset": 0
            }
        )

        // two matches
        assert.deepEqual(
            doc.rows.map(r => r.name),
            [
                "Qux D #1",
                "Qux D #11"
            ]
        )
    })
});
