import React from "react"
import assert from "power-assert"

import { field, or, value } from "../../src/FilterDSL"
import { getFilterExpressionAST, now, today } from "../../filter"
import { DateTime } from "luxon"
import compileFilter from "../../src/util/compileFilter"


describe("compileFilter", function () {

    it("converts FilterDSL js-like expressions to FilterDSL JSON graphs", () => {

        assert.deepEqual(
            compileFilter("or(field(\"name\").eq(value(\"abc\")), field(\"num\").eq(value(5)))"),
            or(field("name").eq(value("abc")), field("num").eq(value(5)))
        )
    })

    it("supports DateTime expressions", () => {

        const ts = "2023-10-31T00:00:00.000+01:00"
        assert.deepEqual(
            compileFilter("value(DateTime.fromISO(\"" + ts + "\"))"),
            value(DateTime.fromISO(ts))
        )
    })

    it("supports Computed Values (simple object literals)", () => {

        const ts = "2023-10-31T00:00:00.000+01:00"
        assert.deepEqual(
            compileFilter("value({\"name\": \"now\"}, \"ComputedValue\" )"),
            value({"name": "now"}, "ComputedValue" )
        )
    })

    it("supports now() and today()", () => {

        assert.deepEqual(
            compileFilter("now()"),
            now()
        )

        assert.deepEqual(
            compileFilter("today()"),
            today()
        )
    })

    it("locks down expression usage", () => {

        // only white listed method on field
        assert.throws(
            () => compileFilter("field(\"name\").fake(value(5))"),
            /Invalid field method: fake/
        )

        // only known root identifiers
        assert.throws(
            () => compileFilter("funk(\"name\")"),
            /Unknown identifier: funk/
        )
        assert.throws(
            () => compileFilter("window"),
            /Unknown identifier: window/
        )
        assert.throws(
            () => compileFilter("window.location"),
            /Invalid AST node: type = MemberExpression/
        )

        // assignments don't work
        assert.throws(
            () => compileFilter("window.location = \"xxx\""),
            /Unexpected "="/
        )

        // we don't even allow operands. Everything has to go through the FilterDSL API.
        assert.throws(
            () => compileFilter("1 + 1"),
            /Unexpected "\+"/
        )

        // If you absolutely want, you can do
        assert.deepEqual(
            compileFilter("value(5).add(value(7))"),
            value(5).add(value(7))
        )

    })

    it("limits DateTime usage", () => {

        assert.throws(
            () => compileFilter("DateTime.foo()"),
            /Invalid DateTime expression. Only DateTime.fromISO/
        )
    })

    it("allows an AST as input", () => {

        assert.deepEqual(
            compileFilter(getFilterExpressionAST("or(field(\"name\").eq(value(\"abc\")), field(\"num\").eq(value(5)))")),
            or(field("name").eq(value("abc")), field("num").eq(value(5)))
        )
    })
})
