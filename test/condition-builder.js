import assert from "power-assert"

import { and, or, not, field, value, component } from "../src/FilterDSL"
import conditionBuilder from "../src/conditionBuilder";


describe("conditionBuilder helper", function () {

    it("builds conditional FilterDSL expressions", function () {

        assert(
            conditionBuilder() === null
        )
        assert(
            conditionBuilder(null) === null
        )
        assert(
            conditionBuilder(false) === null
        )
        assert(
            conditionBuilder(true) === null
        )
        assert(
            conditionBuilder("aaa") === null
        )

        assert.deepEqual(
            conditionBuilder(field("aaa").eq(value("bbb"))),
            {
                "name": "eq",
                "operands": [
                    {
                        "name": "aaa",
                        "type": "Field"
                    },
                    {
                        "name": null,
                        "scalarType": "String",
                        "type": "Value",
                        "value": "bbb"
                    }
                ],
                "type": "Condition"
            }
        )

        assert.deepEqual(
            conditionBuilder(
                field("aaa").eq(value("bbb")),
                field("ccc").lt(value("ddd"))
            ),
            {
                "name": "or",
                "operands": [
                    {
                        "name": "eq",
                        "operands": [
                            {
                                "name": "aaa",
                                "type": "Field"
                            },
                            {
                                "name": null,
                                "scalarType": "String",
                                "type": "Value",
                                "value": "bbb",
                            }
                        ],
                        "type": "Condition"
                    },
                    {
                        "name": "lt",
                        "operands": [
                            {
                                "name": "ccc",
                                "type": "Field"
                            },
                            {
                                "name": null,
                                "scalarType": "String",
                                "type": "Value",
                                "value": "ddd"
                            }
                        ],
                        "type": "Condition"
                    }
                ],
                "type": "Condition"
            })

    });

});
