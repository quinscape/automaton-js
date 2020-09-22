import { before, describe, it } from "mocha"
import assert from "power-assert"
import updateComponentCondition from "../../src/util/updateComponentCondition";
import { and, or, not, field, value, component } from "../../src/FilterDSL";

function dump(value)
{
    console.log(JSON.stringify(value, null, 4));
    return value;
}

describe("updateComponentCondition", function () {

    it("updates component conditions within a composite condition", function () {

        assert.deepEqual(
            updateComponentCondition(
                null,
                field("a").eq(value(1)),
                "test-824",
                true

            ),
            {
                "condition": {
                    "name": "eq",
                    "operands": [
                        {
                            "name": "a",
                            "type": "Field"
                        },
                        {
                            "name": null,
                            "scalarType": "Int",
                            "type": "Value",
                            "value": 1
                        }
                    ],
                    "type": "Condition"
                },
                "id": "test-824",
                "type": "Component"
            }
        )

        assert.deepEqual(
            (
                updateComponentCondition(
                    component("test-12", field("b").eq(value(2))),
                    field("a").eq(value(1)),
                    "test-824",
                    true

                )
            ),
            {
                "type": "Condition",
                "name": "and",
                "operands": [
                    {
                        "type": "Component",
                        "id": "test-12",
                        "condition": {
                            "type": "Condition",
                            "name": "eq",
                            "operands": [
                                {
                                    "type": "Field",
                                    "name": "b"
                                },
                                {
                                    "type": "Value",
                                    "scalarType": "Int",
                                    "value": 2,
                                    "name": null
                                }
                            ]
                        }
                    },
                    {
                        "type": "Component",
                        "id": "test-824",
                        "condition": {
                            "type": "Condition",
                            "name": "eq",
                            "operands": [
                                {
                                    "type": "Field",
                                    "name": "a"
                                },
                                {
                                    "type": "Value",
                                    "scalarType": "Int",
                                    "value": 1,
                                    "name": null
                                }
                            ]
                        }
                    }
                ]
            }
        )

        assert.deepEqual(
            (
                updateComponentCondition(
                    component("test-824",field("a").eq(value(1))),
                    field("a").eq(value(2)),
                    "test-824",
                    true

                )
            ),
            {
                "condition": {
                    "name": "eq",
                    "operands": [
                        {
                            "name": "a",
                            "type": "Field"
                        },
                        {
                            "name": null,
                            "scalarType": "Int",
                            "type": "Value",
                            "value": 2
                        }
                    ],
                    "type": "Condition"
                },
                "id": "test-824",
                "type": "Component"
            }
        )

        const instance = component("test-824",field("a").eq(value(1)));

        // with compareUpdate set, updating a component expression with an expression that is structurally equal to the previous
        // one is detected and results in the exact same composite condition instance being returned, allowing for
        // easy immutable data updates
        assert(
            updateComponentCondition(
                instance,
                field("a").eq(value(1)),
                "test-824",
                true

                ) === instance
        );

    })
});
