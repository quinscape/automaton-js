import { describe, it } from "mocha"
import assert from "power-assert"
import updateComponentCondition from "../../src/util/updateComponentCondition";
import { and, component, condition, field, value } from "../../src/FilterDSL";


function dump(value)
{
    console.log(JSON.stringify(value, null, 4));
    return value;
}

describe("updateComponentCondition", function () {

    it("updates component conditions within a composite condition", function () {

        // no condition + component
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

        // existing component replaced
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

        // replace existing component
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

        // test shortcutting behavior with compareUpdate = true and equal conditions
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

        // existing component with AND + other component
        assert.deepEqual(
            (
                updateComponentCondition(
                    // XXX: this is the way the condition comes from the server. If we use a simple and(), the FilterDSL
                    //      will remove it (hence the condition("and", [... ]) workaround
                    condition("and", [component("test-12", field("b").eq(value(2)))]),
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


        //console.log(JSON.stringify(cond, null ,4))

        assert.deepEqual(
            updateComponentCondition(
                field("b").eq(value(2)),
                field("a").eq(value(1)),
                "test-931",
                true
            ),
            {
                "type": "Condition",
                "name": "and",
                "operands": [
                    {
                        "type": "Component",
                        "id": null,
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
                        "id": "test-931",
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

        //console.log(JSON.stringify(cond, null ,4))
        
        assert.deepEqual(
            updateComponentCondition(
                // XXX: this is the way the condition comes from the server. If we use a simple and(), the FilterDSL
                //      will remove it (hence the condition("and", [... ]) workaround
                and(
                    component(null, field("b").eq(value(2))),
                    component("test-134", field("c").eq(value(3)))
                ),
                field("a").eq(value(1)),
                null,
                true
            ),
            {
                "type": "Condition",
                "name": "and",
                "operands": [
                    {
                        "type": "Component",
                        "id": null,
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
                    },
                    {
                        "type": "Component",
                        "id": "test-134",
                        "condition": {
                            "type": "Condition",
                            "name": "eq",
                            "operands": [
                                {
                                    "type": "Field",
                                    "name": "c"
                                },
                                {
                                    "type": "Value",
                                    "scalarType": "Int",
                                    "value": 3,
                                    "name": null
                                }
                            ]
                        }
                    }
                ]
            }
        )

        const cond = updateComponentCondition(
            field("b").eq(value(2)),
            field("a").eq(value(1)),
            null,
            true
        );

        //console.log(JSON.stringify(cond, null ,4))

        assert.deepEqual(
            cond,
            {
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
        )

    })
});
