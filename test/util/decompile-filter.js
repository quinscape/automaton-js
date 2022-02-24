import React from "react"
import assert from "power-assert"
import filterTransformer, { FieldResolver } from "../../src/util/filterTransformer"

import { field, value, values, and, or, not, condition, operation } from "../../src/FilterDSL"
import { now, today } from "../../filter"
import { DateTime } from "luxon"
import sleep from "../ui/sleep"
import decompileFilter from "../../src/util/decompileFilter"


/**
 * Expects a string starting with a return and a number of spaces. Removes the initial return and that many spaces
 * from each line start.
 * @param s
 * @return {string|*}   String unindented so that the second row starts at column 1
 */
function trimIndent(s)
{
    const m = /^\n[ ]+/.exec(s)

    if (!m)
    {
        return s
    }
    return s.substr(1).replace(new RegExp("^" + m[0].substr(1), "mg"), "")
}


describe("decompileFilter", function () {

    it("converts FilterDSL JSON graphs into FilterDSL compatible expressions", () => {

        assert(decompileFilter(null) === "null")
        assert(decompileFilter(field("num").eq(value(1))) === trimIndent(`
            field("num").eq(
                value(1)
            )`)
        )

        assert(
            decompileFilter(
                and(
                    field("name").containsIgnoreCase(
                        value("aaa")
                    ),
                    field("num").eq(
                        value(2, "Int")
                    )
                )
            ) === trimIndent(`
                and(
                    field("name").containsIgnoreCase(
                        value("aaa")
                    ),
                    field("num").eq(
                        value(2)
                    )
                )`
            )
        )

        assert(
            decompileFilter(
                field("name").toString()
                    .containsIgnoreCase(
                        value("xxx", "String")
                    )
            ) === trimIndent(`
                field("name").toString().containsIgnoreCase(
                    value("xxx")
                )`
          )
        )

        assert(
            decompileFilter(
                or(

                    and(
                        or(
                            field("num")
                                .eq(
                                    value(
                                        100
                                    )
                                ),
                            field("num")
                                .eq(
                                    value(
                                        110
                                    )
                                )
                        ),
                        or(
                            field("num")
                                .eq(
                                    value(
                                        200
                                    )
                                ),
                            field("num")
                                .eq(
                                    value(
                                        210
                                    )
                                )

                        ),
                        field("num")
                            .eq(
                                value(
                                    300
                                )
                            ),
                        field("num")
                            .eq(
                                value(
                                    310
                                )
                            )

                    ),
                    field("description")
                        .containsIgnoreCase(
                            value(
                                ""
                            )
                        )
                )
            ) === trimIndent(`
                or(
                    and(
                        or(
                            field("num").eq(
                                value(100)
                            ),
                            field("num").eq(
                                value(110)
                            )
                        ),
                        or(
                            field("num").eq(
                                value(200)
                            ),
                            field("num").eq(
                                value(210)
                            )
                        ),
                        field("num").eq(
                            value(300)
                        ),
                        field("num").eq(
                            value(310)
                        )
                    ),
                    field("description").containsIgnoreCase(
                        value("")
                    )
                )`
            )
        )

    })
})
