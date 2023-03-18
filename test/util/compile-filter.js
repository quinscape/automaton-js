import React from "react"
import assert from "power-assert"
import filterTransformer, { FieldResolver } from "../../src/util/filterTransformer"

import { field, value, values, and, or, not, condition, operation, toJSON } from "../../src/FilterDSL"
import { now, today } from "../../filter"
import { DateTime } from "luxon"
import sleep from "../ui/sleep"
import decompileFilter from "../../src/util/decompileFilter"
import compileFilter from "../../src/util/compileFilter"


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


describe("compileFilter", function () {

    it("converts FilterDSL js-like expressions to FilterDSL JSON graphs", () => {

        const global = (0,eval)("this")

        global.DateTime = 12
        assert.deepEqual(
            compileFilter("field(\"name\").eq(value(\"abc\"))"),
            toJSON(field("name").eq(value("abc")))
        )

        // ensure env vars were restored to original values
        assert(global.DateTime === 12)

    })

    it("supports DateTime expressions", () => {

        const global = (0,eval)("this")

        global.DateTime = 12
        assert.deepEqual(
            compileFilter("field(\"name\").eq(value(\"abc\"))"),
            toJSON(field("name").eq(value("abc")))
        )

        assert(global.DateTime === 12)

        assert.deepEqual(
            compileFilter("value(DateTime.fromISO(\"2023-10-31T00:00:00.000+01:00\"))"),
            toJSON(value(DateTime.fromISO("2023-10-31T00:00:00.000+01:00")))
        )

    })
})
