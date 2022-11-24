import assert from "power-assert"
import sinon from "sinon"
import { act, fireEvent, render, prettyDOM } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import React from "react"

import config from "../../src/config"
import InteractiveQuery from "../../src/model/InteractiveQuery"
import { FormConfigProvider, FormContext, InputSchema, Select, WireFormat } from "domainql-form"

import DataGrid from "../../src/ui/datagrid/DataGrid"
import sleep from "./sleep";
import {createFilteredMockQuery} from "../../src/util/createMockedQuery";
import {field, value, component, and, condition} from "../../src/FilterDSL"
import {toJS} from "mobx";

const rawSchema = require("./data-grid-schema.json");
const rawFooQuery = require("./iquery-foo.json");
const rawFooDoubleSortedQuery = require("./iquery-foo-double-sort.json");
const rawFooFilteredQuery = require("./iquery-foo-filtered.json");

let updateSpy;
let updateConditionSpy;



describe("DataGrid", function () {

    let format;
    let inputSchema;
    let Q_FooList;
    let currentList;

    before(() => {

        inputSchema = new InputSchema(rawSchema);

        config.inputSchema = inputSchema;

        new FormContext(inputSchema).useAsDefault();

        format = new WireFormat(inputSchema, {
            InteractiveQueryFoo : InteractiveQuery
        });

        Q_FooList = createFilteredMockQuery(format, "InteractiveQueryFoo", require("./iquery-foo.json"));

        return Q_FooList.execute({
            config: {
                    "id": null,
                    "condition": null,
                    "offset": 0,
                    "pageSize": 5,
                    "sortFields": ["name"]
                }
        }).then(({testQuery}) => {
            currentList = testQuery;
            currentList._query = Q_FooList;
        })

    });


    beforeEach(() => {

        updateSpy = sinon.spy();
        updateConditionSpy = sinon.spy();

        //
        // Replace InteractiveQuery.update/updateCondition with spies
        //
        // InteractiveQuery.prototype.update = updateSpy;
        // InteractiveQuery.prototype.updateCondition = updateConditionSpy;
    });


    it("renders rows of iQuery structures", function () {

        const {container, debug} = render(
            <FormConfigProvider schema={ inputSchema }>
                <DataGrid
                    id="test-grid"
                    value={ currentList }
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
        assert(dataRows[1].textContent === "Foo #22admin");
        assert(dataRows[2].textContent === "Foo #4admin");
        assert(dataRows[3].textContent === "Foo #4anonymous");
        assert(dataRows[4].textContent === "Foo #6anonymous");

        // check <em> was rendered
        assert(dataRows[0].querySelector("em").textContent === "admin");

        // pagination is present (more in dedicated tests)
        assert(container.querySelectorAll("ul.pagination"));

    });

    it("provides sort headers", function () {

        let container;

        act(() => {

            const result = render(
                <FormConfigProvider schema={ inputSchema }>
                    <DataGrid
                        id="test-grid"
                        value={ currentList }
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

        return Promise.resolve()
            .then(() => {
        
                act(() => {
                    sortLink.click();
                });

                // yield to render
                return sleep(10);
            })
            .then(() => {
                // console.log(prettyDOM(container));
                const tableHeaders = container.querySelectorAll("th");
                // table is sorted by owner ascending
                assert(tableHeaders[0].querySelector("i.fa-space"));
                assert(tableHeaders[1].querySelector("i.fa-sort-down"));

                const tableCells = container.querySelectorAll("tbody td:nth-child(2)");
                const names = Array.prototype.map.call(tableCells, el => el.textContent);
                // console.log(names);
                assert.deepEqual(names, [
                    "admin",
                    "admin",
                    "admin",
                    "admin",
                    "anonymous"
                ]);

                act(() => {
                    sortLink.click();
                });

                // yield to render
                return sleep(10);
            })
            .then(() => {
                // console.log(prettyDOM(container));
                const tableHeaders = container.querySelectorAll("th");
                // table is sorted by owner descending
                assert(tableHeaders[0].querySelector("i.fa-space"));
                assert(tableHeaders[1].querySelector("i.fa-sort-up"));

                const tableCells = container.querySelectorAll("tbody td:nth-child(2)");
                const names = Array.prototype.map.call(tableCells, el => el.textContent);
                // console.log(names);
                assert.deepEqual(names, [
                    "user_a",
                    "anonymous",
                    "anonymous",
                    "admin",
                    "admin"
                ]);
            })

    });

    it("provides multi-sort headers", function () {

        let container;

        act(() => {

            const result = render(
                <FormConfigProvider schema={ inputSchema }>
                    <DataGrid
                        id="test-grid"
                        value={ currentList }
                    >
                        <DataGrid.Column name="name"/>
                        <DataGrid.Column name="owner.login"/>

                    </DataGrid>
                </FormConfigProvider>
            );

            container = result.container;
        });

        return currentList
            .update({
                sortFields: ["!name", "owner.login"]
            })
            .then(() => {

                // yield to render
                return sleep(0);
            })
            .then(() => {
                // console.log(prettyDOM(container));
                const tableHeaders = container.querySelectorAll("th");
                // table is sorted by name descending & owner ascending
                assert(tableHeaders[0].querySelector("i.fa-sort-up"));
                assert(tableHeaders[1].querySelector("i.fa-sort-down"));

                const tableCells = container.querySelectorAll("tbody tr.data");
                const names = Array.prototype.map.call(tableCells, el => el.textContent);
                // console.log(names);
                assert.deepEqual(names, [
                    'Foo #8user_a',
                    'Foo #7admin',
                    'Foo #6anonymous',
                    'Foo #4admin',
                    'Foo #4anonymous'
                ]);
            });

    });

    it("renders column filters", function () {

        let container;

        return Q_FooList
            .execute({
                config: {
                    "id": null,
                    "condition": condition(
                        "and",
                        [
                            component(
                                "filter-test-grid",
                                condition(
                                    "and",
                                    [
                                        field("name").containsIgnoreCase(
                                            value("1")
                                        )
                                    ]
                                )
                            )
                        ]
                    ),
                    "offset": 0,
                    "pageSize": 5,
                    "sortFields": ["name"]
                }
            })
            .then(({testQuery}) =>
            {

                // console.log(JSON.stringify(toJS(testQuery.queryConfig.condition), null, 4))

                currentList = testQuery;
                currentList._query = Q_FooList;


                const types = [
                    "TYPE_A",
                    "TYPE_B",
                    "TYPE_C",
                    "TYPE_D"
                ];

                act(
                    () =>
                    {
                        const result = render(
                            <FormConfigProvider schema={inputSchema}>
                                <DataGrid
                                    id="filter-test-grid"
                                    value={currentList}
                                    filterTimeout={10}
                                >
                                    <DataGrid.Column name="name" filter="containsIgnoreCase"/>
                                    <DataGrid.Column name="description" filter="containsIgnoreCase"/>
                                    <DataGrid.Column name="flag" filter="eq"/>
                                    <DataGrid.Column name="type" filter="eq" renderFilter={
                                        (name, scalarType, label) =>
                                        {
                                            /**
                                             * Use another iQuery (on FooType) as select values
                                             */
                                            return (
                                                <Select
                                                    name={name}
                                                    values={types}
                                                    type={scalarType}
                                                    label={label}
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

                return sleep(10);
            })
            .then(() => {

                // console.log(prettyDOM(container));

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

                return sleep(20);
            })
            .then(() => {

                // console.log(JSON.stringify(toJS(currentList.queryConfig.condition), null, 4))

                assert.deepEqual(currentList.queryConfig.condition, {
                    "type": "Condition",
                    "name": "and",
                    "operands": [
                        {
                            "type": "Component",
                            "id": "filter-test-grid",
                            "condition": null
                        }
                    ]
                });

            })

            // Type "xx" into the description filter
            .then(() => {

                const filterRow = container.querySelector("tr.filter");
                const filterInputs = filterRow.querySelectorAll("tr.filter input,select");


                filterInputs[1].setSelectionRange(0, filterInputs[1].value.length)
                userEvent.type(
                    filterInputs[1],
                    "xx"
                )
                return sleep(20)
            })
            .then(() => {

                // console.log(JSON.stringify(toJS(currentList.queryConfig.condition), null, 4))

                assert.deepEqual(currentList.queryConfig.condition, {
                    "type": "Condition",
                    "name": "and",
                    "operands": [
                        {
                            "type": "Component",
                            "id": "filter-test-grid",
                            "condition": {
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
                            }
                        }
                    ]
                });

            })
            .then(() => {

                const filterRow = container.querySelector("tr.filter");
                const filterInputs = filterRow.querySelectorAll("tr.filter input,select");

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

                // console.log(JSON.stringify(toJS(currentList.queryConfig.condition), null, 4));

                assert.deepEqual(currentList.queryConfig.condition, {
                    "type": "Condition",
                    "name": "and",
                    "operands": [
                        {
                            "type": "Component",
                            "id": "filter-test-grid",
                            "condition": {
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
                            }
                        }
                    ]
                });

            })
            .then(() => {

                const filterRow = container.querySelector("tr.filter");
                const filterInputs = filterRow.querySelectorAll("tr.filter input,select");

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

                // console.log(JSON.stringify(toJS(currentList.queryConfig.condition), null, 4));

                assert.deepEqual(currentList.queryConfig.condition, {
                    "type": "Condition",
                    "name": "and",
                    "operands": [
                        {
                            "type": "Component",
                            "id": "filter-test-grid",
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
                            }
                        }
                    ]
                });

            });

    });
});
