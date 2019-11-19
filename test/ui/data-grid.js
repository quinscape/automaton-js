import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import React from "react"

import config from "../../src/config"
import InteractiveQuery from "../../src/model/InteractiveQuery"
import { FormConfigProvider, InputSchema, Select, WireFormat } from "domainql-form"

import DataGrid from "../../src/ui/datagrid/IQueryGrid"
import sleep from "./sleep";

const rawSchema = require("./test-schema-2.json");
const rawFooQuery = require("./iquery-foo.json");
const rawFooDoubleSortedQuery = require("./iquery-foo-double-sort.json");
const rawFooFilteredQuery = require("./iquery-foo-filtered.json");

let updateSpy;
let updateConditionSpy;



describe("DataGrid", function () {

    let format;
    let inputSchema;

    before(() => {
        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        format = new WireFormat(inputSchema, {
            InteractiveQueryFoo : InteractiveQuery
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

    it("renders rows of iQuery structures", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryFoo"
            },
            rawFooQuery,
            true
        );


        const {container, debug} = render(
            <FormConfigProvider schema={ inputSchema }>
                <DataGrid
                    id="test-grid"
                    value={ iQuery }
                >
                    <DataGrid.Column name="name"/>
                    <DataGrid.Column name="owner.login">
                        {
                            row => (
                                <em>
                                    {
                                        row.owner.login
                                    }
                                </em>
                            )
                        }
                    </DataGrid.Column>

                </DataGrid>
            </FormConfigProvider>
        );

        const tableHeaders = container.querySelectorAll("th");

        assert(tableHeaders[0].textContent === "name");
        assert(tableHeaders[1].textContent === "owner.login");

        const dataRows = container.querySelectorAll("tr.data");

        assert(dataRows.length === 5);
        assert(dataRows[0].textContent === "Foo #1admin");
        assert(dataRows[1].textContent === "Foo #22anonymous");
        assert(dataRows[2].textContent === "Foo #33user_b");
        assert(dataRows[3].textContent === "Foo #4anonymous");
        assert(dataRows[4].textContent === "Foo #6anonymous");

        // check <em> was rendered
        assert(dataRows[0].querySelector("em").textContent === "admin");

        // pagination is present (more in dedicated tests)
        assert(container.querySelectorAll("ul.pagination"));

    });

    it("provides sort headers", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryFoo"
            },
            rawFooQuery,
            true
        );

        let container;

        act(() => {

            const result = render(
                <FormConfigProvider schema={ inputSchema }>
                    <DataGrid
                        id="test-grid"
                        value={ iQuery }
                    >
                        <DataGrid.Column name="name"/>
                        <DataGrid.Column name="owner.login"/>

                    </DataGrid>
                </FormConfigProvider>
            );

            container = result.container;
        });


        const tableHeaders = container.querySelectorAll("th");

        // table is sorted by name ascending
        assert(tableHeaders[0].querySelector("i.fa-sort-down"));

        const sortLink = tableHeaders[1].querySelector("a");
        assert(sortLink);

        act(() => {
            sortLink.click();
        });

        assert(updateSpy.called)
        assert.deepEqual(updateSpy.args[0], [
            {
                "currentPage": 0,
                "sortFields": [
                    "owner.login"
                ]
            }
        ])

    });

    it("provides multi-sort headers", function () {

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryFoo"
            },
            rawFooDoubleSortedQuery,
            true
        );

        let container;

        act(() => {

            const result = render(
                <FormConfigProvider schema={ inputSchema }>
                    <DataGrid
                        id="test-grid"
                        value={ iQuery }
                    >
                        <DataGrid.Column name="name"/>
                        <DataGrid.Column name="owner.login"/>

                    </DataGrid>
                </FormConfigProvider>
            );

            container = result.container;
        });


        const tableHeaders = container.querySelectorAll("th");

        // table is sorted by name descending and owner.login ascending
        assert(tableHeaders[0].querySelector("i.fa-sort-up"));
        assert(tableHeaders[1].querySelector("i.fa-sort-down"));

        const sortLink = tableHeaders[0].querySelector("a");
        assert(sortLink);

        act(() => {
            sortLink.click();
        });

        assert(updateSpy.called)

        // first click on column nevertheless sorts it by the column, ascending.
        assert.deepEqual(updateSpy.args[0], [
            {
                "currentPage": 0,
                "sortFields": [
                    "name"
                ]
            }
        ])

    });

    it("renders column filters", function (done) {

        const types = [
            "TYPE_A",
            "TYPE_B",
            "TYPE_C",
            "TYPE_D"
        ];

        const iQuery = format.convert(
            {
                kind: "OBJECT",
                name: "InteractiveQueryFoo"
            },
            rawFooFilteredQuery,
            true
        );


        let container;
        act(
            () => {
                const result = render(
                    <FormConfigProvider schema={ inputSchema }>
                        <DataGrid
                            id="filter-test-grid"
                            value={ iQuery }
                            filterTimeout={ 10 }
                        >
                            <DataGrid.Column name="name" filter="containsIgnoreCase"/>
                            <DataGrid.Column name="description" filter="containsIgnoreCase"/>
                            <DataGrid.Column name="flag" filter="eq"/>
                            <DataGrid.Column name="type" filter="eq" renderFilter={
                                (name, scalarType, label) => {
                                    /**
                                     * Use another iQuery (on FooType) as select values
                                     */
                                    return (
                                        <Select
                                            name={ name }
                                            values={ types }
                                            type={ scalarType }
                                            label={ label }
                                            labelClass="sr-only"
                                        />
                                    );
                                }
                            }/>

                        </DataGrid>
                    </FormConfigProvider>
                );

                container = result.container;
            }
        )

        const filterRow = container.querySelector("tr.filter");

        assert(filterRow);


        const filterInputs = filterRow.querySelectorAll("tr.filter input,select");

        assert(filterInputs.length === 4);
        // pre-initialized filter value
        assert(filterInputs[0].value === "1")

        // Clear name column filter
        
        act(
            () => {

                fireEvent.change(filterInputs[0], {
                    target: {
                        value: ""
                    }
                });

            }
        );

        sleep(20)
            .then(() => {
                assert(updateConditionSpy.called)
                assert.deepEqual(updateConditionSpy.args[0], [
                    null,
                    "filter-test-grid",
                    true
                ]);

            })

            // Type "xx" into the description filter
            .then(() => {
                act(
                    () => {
                        userEvent.type(
                            filterInputs[1],
                            "xx"
                        )
                    }
                );
                return sleep(20);
            })
            .then(() => {

                assert(updateConditionSpy.callCount === 2)

                assert.deepEqual(updateConditionSpy.args[1], [
                    {
                        "type": "Condition",
                        "name": "and",
                        "operands": [
                            {
                                "type": "Condition",
                                "name": "containsIgnoreCase",
                                "operands": [
                                    {
                                        "type": "Field",
                                        "name": "description"
                                    },
                                    {
                                        "type": "Value",
                                        "scalarType": "String",
                                        "value": "xx",
                                        "name": null
                                    }
                                ]
                            }
                        ]
                    },
                    "filter-test-grid",
                    true
                ]);

            })
            .then(() => {

                act(
                    () => {


                        fireEvent.change(filterInputs[2], {
                            target: {
                                value: "true"
                            }
                        });

                    }
                );

                return sleep(20);
            })
            .then(() => {

                assert(updateConditionSpy.callCount === 3)

                //console.log(JSON.stringify(updateConditionSpy.args[2], null, 4))

                assert.deepEqual(updateConditionSpy.args[2], [
                    {
                        "type": "Condition",
                        "name": "and",
                        "operands": [
                            {
                                "type": "Condition",
                                "name": "containsIgnoreCase",
                                "operands": [
                                    {
                                        "type": "Field",
                                        "name": "description"
                                    },
                                    {
                                        "type": "Value",
                                        "scalarType": "String",
                                        "value": "xx",
                                        "name": null
                                    }
                                ]
                            },
                            {
                                "type": "Condition",
                                "name": "eq",
                                "operands": [
                                    {
                                        "type": "Field",
                                        "name": "flag"
                                    },
                                    {
                                        "type": "Value",
                                        "scalarType": "Boolean",
                                        "value": true,
                                        "name": null
                                    }
                                ]
                            }
                        ]
                    },
                    "filter-test-grid",
                    true
                ]);

            })
            .then(() => {

                act(
                    () => {


                        fireEvent.change(filterInputs[1], {
                            target: {
                                value: ""
                            }
                        });

                        fireEvent.change(filterInputs[2], {
                            target: {
                                value: ""
                            }
                        });

                        fireEvent.change(filterInputs[3], {
                            target: {
                                value: "TYPE_B"
                            }
                        });

                    }
                );

                return sleep(20);
            })
            .then(() => {

                assert(updateConditionSpy.callCount === 4)

                //console.log(JSON.stringify(updateConditionSpy.args[3], null, 4))

                assert.deepEqual(updateConditionSpy.args[3], [
                    {
                        "type": "Condition",
                        "name": "and",
                        "operands": [
                            {
                                "type": "Condition",
                                "name": "eq",
                                "operands": [
                                    {
                                        "type": "Field",
                                        "name": "type"
                                    },
                                    {
                                        "type": "Value",
                                        "scalarType": "String",
                                        "value": "TYPE_B",
                                        "name": null
                                    }
                                ]
                            }
                        ]
                    },
                    "filter-test-grid",
                    true
                ]);

            })
            .then(done);
    });
});
