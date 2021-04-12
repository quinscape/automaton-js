import Layout from "../components/Layout";
import cx from "classnames";
import { getPageDefaults } from "../service/docs";
import TOCLink from "../components/TOCLink";
import React, { useState } from "react";
import { useRouter } from "next/router";
import * as PropTypes from "prop-types";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import { filterByCategory } from "../service/docs-filter";

const Category = ({title, docs : docsFromProps, search}) => {

    const filtered = search ?
        docsFromProps.filter(doc => doc.name.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) >= 0) :
        docsFromProps;


    return (
        <>
            <h3>
                {
                    title
                }
            </h3>
            {
                !filtered.length && "---"
            }
            {
                filtered.map(doc => <TOCLink key={ doc.name } doc={ doc }/>)
            }
        </>
    )
};


function SearchForm({search, setSearch})
{
    return (
        <form action="#" onSubmit={ ev => ev.preventDefault()}>
            <div className="row align-items-center mb-2">
                <div className="col-6">
                    <label className="sr-only" htmlFor="searchField">Search</label>
                    <div className="input-group mb-2">
                        <div className="input-group-prepend">
                            <div className="input-group-text">
                                <i className="fas fa-search"/>
                            </div>
                        </div>
                        <input
                            id="searchField"
                            type="text"
                            className="form-control"
                            value={ search }
                            onChange={ ev => setSearch(ev.target.value) }
                            placeholder="@quinscape/automaton-js symbol"
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}


SearchForm.propTypes = {
    search: PropTypes.string,
    setSearch: PropTypes.func
};


function HomePage(props)
{
    const { docs } = props;

    const router = useRouter();

    const [ search, setSearch ] = useState("");

    return (
        <Layout {...props}>
            <div className="row">
                <div className="col">
                    <h1 className="mt-3">
                        Welcome
                    </h1>
                    <p>
                        Welcome to the new automaton-js documentation site.
                    </p>
                </div>
            </div>
            <section>
                <div className="row">
                    <div className="col">
                        <h2>Documentation</h2>
                        <a className="btn btn-link btn-sm" href={ router.basePath + "/config" }>
                            Automaton-Js Static Config
                        </a>
                    </div>
                    <div className="col">
                        <h2>Tutorials</h2>
                        <a className="btn btn-link btn-sm" href={ router.basePath + "/config" }>
                            Automaton-Js Static Config
                        </a>
                    </div>
                    <div className="col">
                    </div>
                </div>
                <hr/>
            </section>
            <section>
                <div className="row">
                    <div className="col">
                        <h2>Reference</h2>
                        <SearchForm search={ search } setSearch={ setSearch }/>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <Category
                            title="Declarative API"
                            search={ search }
                            docs={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("declarative"))
                            }
                        />
                        <Category
                            title="InteractiveQuery / Filter"
                            search={ search }
                            docs={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("iquery"))

                            }
                        />
                        <Category
                            title="Domain-Object Helpers"
                            search={ search }
                            docs={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("domain"))

                            }
                        />
                        <Category
                            title="Process"
                            search={ search }
                            docs={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("process"))

                            }
                        />
                    </div>
                    <div className="col">
                        <Category
                            title="Components"
                            search={ search }
                            docs={
                                docs.components
                                    .map( name => docs.docs[name])
                            }
                        />
                        <Category
                            title="Hooks"
                            search={ search }
                            docs={
                                docs.hooks
                                    .map( name => docs.docs[name])
                            }
                        />
                        <Category
                            title="Classes"
                            search={ search }
                            docs={
                                docs.classes
                                    .map( name => docs.docs[name])
                            }
                        />
                    </div>
                    <div className="col">
                        <Category
                            title="Schema / Types"
                            search={ search }
                            docs={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("schema"))

                            }
                        />
                        <Category
                            title="Websocket"
                            search={ search }
                            docs={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("websocket"))

                            }
                        />
                        <Category
                            title="Configuration"
                            search={ search }
                            docs={
                                docs.utils
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory())
                            }
                        />
                        <Category
                            title="Functions"
                            search={ search }
                            docs={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory())

                            }
                        />
                        <Category
                            title="Browser Helpers"
                            search={ search }
                            docs={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("helper"))

                            }
                        />
                    </div>
                </div>
            </section>
        </Layout>
    )
}

export default HomePage


export async function getStaticProps(context)
{
    return getPageDefaults({
        title: "Main Page"
    })
}

