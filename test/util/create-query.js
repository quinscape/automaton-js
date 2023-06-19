import React from "react"
import assert from "power-assert"

import { field, or, value } from "../../src/FilterDSL"
import createQuery, { nestFields } from "../../src/util/createQuery"
import { trimIndent } from "./decompile-filter"


describe("createQuery", function () {

    it("creates GraphQLQueries from query data", () => {

        const qFoo = createQuery("Foo", {
            select: ["name", "num", "owner.id", "owner.login"],
            sort: ["name"],
            where: field("name").eq(value("Foo #1"))
        })

        // more extensive tests below
        assert(qFoo.query === `query iQueryFoo($config: QueryConfigInput!)
        {

            iQueryFoo(config: $config)
            {
                type
                columnStates{
                    name
                    enabled
                    sortable
                }
                queryConfig{
                    id
                    condition
                    offset
                    pageSize
                    sortFields
                }
                rows{
                    name
                    num
                    owner {
                        id
                        login
                    }

                }
                rowCount
            }
        }`)

        assert.deepEqual(
            qFoo.defaultVars, {
                "config": {
                    "sortFields": [
                        "name"
                    ],
                    "condition": {
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
                                "value": "Foo #1",
                                "name": null
                            }
                        ]
                    },
                    "offset": 0,
                    "pageSize": 100
                }
            }
        )
    })


    describe("Field Nesting", function () {

        it("renders a list of GraphQL fields to a field selection", () => {

            assert(
                nestFields(["a", "b", "c"]) === "a\nb\nc\n"
            )
            assert(
                nestFields(
                    ["a", "b.c", "b.d.e"]) === trimIndent(`
                    a
                    b {
                        c
                        d {
                            e
                        }
                    }
                    `)
            )

            assert(
                nestFields(
                    ["a", "b.c", "b.d", "e"]) === trimIndent(`
                a
                b {
                    c
                    d
                }
                e
                `)
            )

            assert(
                nestFields(
                    ["a.b", "a.c", "b.d", "b.e"]) === trimIndent(`
                a {
                    b
                    c
                }
                b {
                    d
                    e
                }
                `)
            )

            assert(
                nestFields(
                    ["f.a.b", "f.a.c", "f.b.d", "f.b.e"]) === trimIndent(`
                    f {
                        a {
                            b
                            c
                        }
                        b {
                            d
                            e
                        }
                    }
                    `)
            )

            assert(
                nestFields(
                    ["a.b.c.d", "a.b.c.e", "a.f.g.h", "a.f.g.i", "a.j", "k"]) === trimIndent(`
                    a {
                        b {
                            c {
                                d
                                e
                            }
                        }
                        f {
                            g {
                                h
                                i
                            }
                        }
                        j
                    }
                    k
                    `)
            )
            assert(
                nestFields(
                    ["a.b.c.d", "a.b.c.e", "a.f.g.h", "a.f.g.i", "a.j", "k"]) === trimIndent(`
                    a {
                        b {
                            c {
                                d
                                e
                            }
                        }
                        f {
                            g {
                                h
                                i
                            }
                        }
                        j
                    }
                    k
                    `)
            )

            assert(
                nestFields(
                    ["a.b.c.d", "a.b.c.e", "f", "g.h.i.j", "g.h.i.k"]) === trimIndent(`
                    a {
                        b {
                            c {
                                d
                                e
                            }
                        }
                    }
                    f
                    g {
                        h {
                            i {
                                j
                                k
                            }
                        }
                    }
                    `)
            )

        })
    })
})
