import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, render, getByText } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { runInAction } from "mobx"

import React from "react"

import config from "../../src/config"
import InteractiveQuery from "../../src/model/InteractiveQuery"
import { FormConfigProvider, InputSchema, Select, WireFormat } from "domainql-form"

import DataGrid from "../../src/ui/datagrid/IQueryGrid"
import sleep from "./sleep";
import Pagination from "../../src/ui/Pagination";

const rawSchema = require("./test-schema-2.json");
const rawBarQuery = require("./iquery-bar.json");

let updateSpy;
let updateConditionSpy;

describe("Pagination", function () {

    let format;
    let inputSchema;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryBar : InteractiveQuery
        });
    });

    beforeEach(() => {

        updateSpy = sinon.spy();
        updateConditionSpy = sinon.spy();

        //
        // Replace InteractiveQuery.update/updateCondition with spies
        //
        InteractiveQuery.prototype.update = updateSpy;
        InteractiveQuery.prototype.updateCondition = updateConditionSpy;
    });

    it("controls iQuery pagination", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryBar"
            },
            rawBarQuery,
            true
        );

        let container, debug;

        act(() => {

            const result = render(
                <Pagination iQuery={ iQuery } />
            );

            container = result.container;
            debug = result.debug;
        });


        {
            const first = getByText(container, "[First]");
            const prev = getByText(container, "[Prev]");
            const next = getByText(container, "[Next]");
            const last = getByText(container, "[Last]");
            const current = getByText(container, "1");
            assert(first.tagName === "SPAN");
            assert(prev.tagName === "SPAN");
            assert(current.parentNode.classList.contains("active"));
            assert(next.tagName === "A");
            assert(last.tagName === "A");

            act(
                () => {
                    next.click();
                }
            );

            assert(updateSpy.called);
            assert.deepEqual(updateSpy.args[0], [
                {
                    "offset": 1 * 5
                }
            ]);

            act(
                () => {
                    last.click();
                }
            );

            assert(updateSpy.callCount === 2);
            assert.deepEqual(updateSpy.args[1], [
                {
                    "offset": 39 * 5
                }
            ])
        }

        // update to second page
        {
            runInAction( () => iQuery.queryConfig.offset = 5);

            const first = getByText(container, "[First]");
            const prev = getByText(container, "[Prev]");
            const next = getByText(container, "[Next]");
            const last = getByText(container, "[Last]");
            const current = getByText(container, "2");
            const prevByOffset = getByText(container, "1");
            assert(first.tagName === "A");
            assert(prev.tagName === "A");
            assert(first.dataset.page === prev.dataset.page);

            assert(current.parentNode.classList.contains("active"));
            assert(next.tagName === "A");
            assert(last.tagName === "A");

            act(
                () => {
                    next.click();
                }
            );

            assert(updateSpy.callCount === 3);
            assert.deepEqual(updateSpy.args[2], [
                {
                    "offset": 2 * 5
                }
            ]);

            act(
                () => prevByOffset.click()
            );

            assert(updateSpy.callCount === 4);
            assert.deepEqual(updateSpy.args[3], [
                {
                    "offset": 0
                }
            ]);
        }

        // update to second to last page
        {
            runInAction( () => iQuery.queryConfig.offset = 38 * 5);

            const first = getByText(container, "[First]");
            const prev = getByText(container, "[Prev]");
            const next = getByText(container, "[Next]");
            const last = getByText(container, "[Last]");
            const current = getByText(container, "39");
            assert(first.tagName === "A");
            assert(prev.tagName === "A");
            assert(next.dataset.page === last.dataset.page);

            assert(current.parentNode.classList.contains("active"));
            assert(next.tagName === "A");
            assert(last.tagName === "A");

            act(
                () => {
                    next.click();
                }
            );

            assert(updateSpy.callCount === 5);
            assert.deepEqual(updateSpy.args[4], [
                {
                    "offset": 39 * 5
                }
            ]);
        }

        // update to last page
        {
            runInAction( () => iQuery.queryConfig.offset = 39 * 5);

            const first = getByText(container, "[First]");
            const prev = getByText(container, "[Prev]");
            const next = getByText(container, "[Next]");
            const last = getByText(container, "[Last]");
            const current = getByText(container, "40");
            assert(current.parentNode.classList.contains("active"));
            assert(first.tagName === "A");
            assert(prev.tagName === "A");

            assert(next.tagName === "SPAN");
            assert(last.tagName === "SPAN");

        }

        // change page size to 50
        {

            runInAction( () => {
                iQuery.queryConfig.offset = 0;
                iQuery.queryConfig.pageSize = 50;
            });

            const first = getByText(container, "[First]");
            const prev = getByText(container, "[Prev]");
            const next = getByText(container, "[Next]");
            const last = getByText(container, "[Last]");
            const current = getByText(container, "1");
            assert(current.parentNode.classList.contains("active"));
            assert(first.tagName === "SPAN");
            assert(prev.tagName === "SPAN");

            assert(next.tagName === "A");
            assert(last.tagName === "A");

            act(
                () => {
                    last.click();
                }
            );

            assert(updateSpy.callCount === 6);
            assert.deepEqual(updateSpy.args[5], [
                {
                    "offset": 150
                }
            ])

        }

        {
            const selectElem = container.querySelector("select");

            act(
                () => {
                    fireEvent.change(selectElem, {
                        target: {
                            value: "2147483647"
                        }
                    });
                }
            );

            assert(container.querySelectorAll("page-link").length === 0)
        }
    });
});
