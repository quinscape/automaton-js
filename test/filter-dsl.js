import assert from "power-assert"

import { and, or, not, field, value, component } from "../src/FilterDSL"


describe("Filter DSL", function () {

    it("creates a serializable representations of JOOQ conditions", function () {

        const filter = field("name").equalIgnoreCase(
            value("abc")
        );

        assert.deepEqual(filter, {
            "type": "Condition",
            "name": "equalIgnoreCase",
            "operands": [
                {
                    "type": "Field",
                    "name": "name"
                }, {
                    "type": "Value",
                    "scalarType": "String",
                    "name": null,
                    "value": "abc"
                }
            ]
        })

    });

    it("supports chained boolean logic", function () {

        const filter = field("name").eq(
            value("abc")
        ).and(
            field("num").eq(
                value( 12)
            )
        );

        //console.log(JSON.stringify(filter, null, 4))

        assert.deepEqual(filter, {
                "type": "Condition",
                "name": "and",
                "operands": [
                    {
                        "type": "Condition",
                        "name": "eq",
                        "operands": [
                            {
                                "type": "Field",
                                "name": "name"
                            },
                            {
                                "type": "Value",
                                "name": null,
                                "scalarType": "String",
                                "value": "abc"
                            }
                        ]
                    },
                    {
                        "type": "Condition",
                        "name": "eq",
                        "operands": [
                            {
                                "type": "Field",
                                "name": "num"
                            },
                            {
                                "type": "Value",
                                "name": null,
                                "scalarType": "Int",
                                "value": 12
                            }
                        ]
                    }
                ]
            }
        );

    });

    it("supports global logic", function () {

        const filter = and(
            field("name").eq(
                value("abc")
            ),
            or(
                field("num").eq(
                    value(12)
                ),
                not(
                    field("flag").isTrue(),
                )
            )

        );

        //console.log(JSON.stringify(filter, null, 4))

        assert.deepEqual(filter, {
                "type": "Condition",
                "name": "and",
                "operands": [
                    {
                        "type": "Condition",
                        "name": "eq",
                        "operands": [
                            {
                                "type": "Field",
                                "name": "name"
                            },
                            {
                                "type": "Value",
                                "scalarType": "String",
                                "name": null,
                                "value": "abc"
                            }
                        ]
                    },
                    {
                        "type": "Condition",
                        "name": "or",
                        "operands": [
                            {
                                "type": "Condition",
                                "name": "eq",
                                "operands": [
                                    {
                                        "type": "Field",
                                        "name": "num"
                                    },
                                    {
                                        "type": "Value",
                                        "name": null,
                                        "scalarType": "Int",
                                        "value": 12
                                    }
                                ]
                            },
                            {
                                "type": "Condition",
                                "name": "not",
                                "operands": [
                                    {
                                        "type": "Condition",
                                        "name": "isTrue",
                                        "operands": [
                                            {
                                                "type": "Field",
                                                "name": "flag"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        );

    });

    it("supports field operations", function () {

        const filter = field("numA").add(
                field("numB")
            ).gt(
                value( 100)
            );

        //console.log(JSON.stringify(filter, null, 4))

        assert.deepEqual(filter, {
                "type": "Condition",
                "name": "gt",
                "operands": [
                    {
                        "type": "Operation",
                        "name": "add",
                        "operands": [
                            {
                                "type": "Field",
                                "name": "numA"
                            },
                            {
                                "type": "Field",
                                "name": "numB"
                            }
                        ]
                    },
                    {
                        "type": "Value",
                        "scalarType": "Int",
                        "name": null,
                        "value": 100
                    }
                ]
            }
        );

    });
    
    it("allows predefined conditions", function () {

        // nothing new functionally, example of how to set up a preselected iQuery condition in Js

        // condition for a <IQueryGrid id="animals-grid" />
        const condition = and(
            component("animals-grid",
                and(
                    field("name")
                        .containsIgnoreCase(
                            value(
                                "b"
                            )
                        ),
                    field("parent.name")
                        .containsIgnoreCase(
                            value(
                                "Fish"
                            )
                        )
                )
            )
        );

        //console.log(JSON.stringify(condition, null, 4))

        assert.deepEqual(
            condition,
            {
                "condition": {
                    "operands": [
                        {
                            "operands": [
                                {
                                    "name": "name",
                                    "type": "Field"
                                },
                                {
                                    "name": null,
                                    "scalarType": "String",
                                    "type": "Value",
                                    "value": "b"
                                }
                            ],
                            "name": "containsIgnoreCase",
                            "type": "Condition"
                        },
                        {
                            "operands": [
                                {
                                    "name": "parent.name",
                                    "type": "Field"
                                },
                                {
                                    "name": null,
                                    "scalarType": "String",
                                    "type": "Value",
                                    "value": "Fish"
                                }
                            ],
                            "name": "containsIgnoreCase",
                            "type": "Condition"
                        }
                    ],
                    "name": "and",
                    "type": "Condition"
                },
                "id": "animals-grid",
                "type": "Component"
            }
        )

    });
    it("organizes condition in component nodes", function () {

        const val1 = value( "abc");

        const val2 = value(12);

        const filter = component("test-component",
            and(
                field("name").eq( val1),
                field("num").eq( val2)
            )
        );

        //console.log(JSON.stringify(filter, null, 4))

        assert.deepEqual(
            filter,
            {
                "type": "Component",
                "id": "test-component",
                "condition": {
                    "type": "Condition",
                    "name": "and",
                    "operands": [
                        {
                            "type": "Condition",
                            "name": "eq",
                            "operands": [
                                {
                                    "type": "Field",
                                    "name": "name"
                                },
                                {
                                    "type": "Value",
                                    "scalarType": "String",
                                    "name": null,
                                    "value": "abc"
                                }
                            ]
                        },
                        {
                            "type": "Condition",
                            "name": "eq",
                            "operands": [
                                {
                                    "type": "Field",
                                    "name": "num"
                                },
                                {
                                    "type": "Value",
                                    "scalarType": "Int",
                                    "name": null,
                                    "value": 12
                                }
                            ]
                        }
                    ]
                }
            }
        )

    });

    it("allows for optional conditions", function () {

        // XXX: by ignoring non-object arguments, we allow for easy conditional expression building
        //      like
        //      and(
        //          option && field("a")
        //              .eq(
        //                  value(b)
        //              )
        //          )

        assert(
            and() === null
        )
        assert(
            and(null) === null
        )
        assert(
            and(false) === null
        )
        assert(
            and(true) === null
        )
        assert(
            and("aaa") === null
        )

        assert.deepEqual(
            and(field("aaa").eq(value("bbb"))),
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
            and(
                field("aaa").eq(value("bbb")),
                field("ccc").lt(value("ddd"))
            ),
            {
                "name": "and",
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

//////////////////////////////////
        assert(
            or() === null
        )
        assert(
            or(null) === null
        )
        assert(
            or(false) === null
        )
        assert(
            or(true) === null
        )
        assert(
            or("aaa") === null
        )

        assert.deepEqual(
            or(field("aaa").eq(value("bbb"))),
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
            or(
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
    })
});
