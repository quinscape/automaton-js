import Layout from "../components/Layout";
import cx from "classnames";
import { getPageDefaults } from "../service/docs";
import TOCLink from "../components/TOCLink";
import React, { useState } from "react";
import { useRouter } from "next/router";
import * as PropTypes from "prop-types";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import { filterByCategory } from "../service/docs-filter";
import { EXPLANATION, DOCUMENTATION, HOWTO, findMarkdownBySource, getPathsByPrefix } from "../service/markdown-filter";

//import Logo from "../components/automaton-logo.svg"
import Logo from "../components/data-injection.svg"

const ReferenceCategory = ({title, docs, names: names, search}) => {

    // if we don't have any data at all, display nothing
    if (!names.length)
    {
        return false;
    }

    const filtered = search ?
        names.filter(doc => doc.name.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) >= 0) :
        names;

    return (
        <>
            <h3>
                {
                    title
                }
            </h3>
            <ul className="list-unstyled">
                {
                    // display placeholder item if we have no items after filtering
                    !filtered.length && (
                        <li>
                            ---
                        </li>
                    )
                }
                {
                    filtered.map(doc => (
                        <li
                            key={ doc.name }
                        >
                            <TOCLink
                                docs={ docs }
                                name={ doc.name }
                                short={ true }
                            />
                        </li>
                    ))
                }
            </ul>
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


function DocumentationCategory({docs, title, prefix, path})
{
    const router = useRouter();

    return (
        <>
            <h2>
                {
                    title
                }
            </h2>
            <ul className="list-unstyled">
                {
                    getPathsByPrefix(docs.handwritten, prefix).map(
                        name => {
                            const hw = findMarkdownBySource(docs.handwritten, prefix + name + ".md")
                            return (


                                <li
                                    key={ name }
                                >
                                    <a
                                        className="btn btn-link"
                                        href={ router.basePath + path + name }
                                    >
                                        {
                                            hw.toc.title
                                        }
                                    </a>
                                </li>
                            );
                        }
                    )
                }
            </ul>
        </>
    );
}


DocumentationCategory.propTypes = {
    prefix: PropTypes.string,
    title: PropTypes.string
};


function HomePage(props)
{
    const { docs } = props;

    const router = useRouter();

    const [ search, setSearch ] = useState("");

    return (
        <Layout {...props}>
            <div className="row">
                <div className="col-8">
                    <h1 className="mt-3">
                        Welcome
                    </h1>
                    <p>
                        Welcome to the new automaton-js documentation site.
                    </p>
                    <div className="row">
                        <div className="col">
                            <DocumentationCategory
                                docs={ docs }
                                title="Documentation"
                                prefix={ DOCUMENTATION }
                                path={"/tutorial/"}
                            />
                        </div>
                        <div className="col align-self-end">
                            <DocumentationCategory
                                docs={ docs }
                                title="Background"
                                path={"/explanation/"}
                                prefix={ EXPLANATION}
                            />
                            <DocumentationCategory
                                docs={ docs }
                                title="How-Tos"
                                path={"/howto/"}
                                prefix={ HOWTO }
                            />
                        </div>

                    </div>
                </div>
                <div className="col-4">
                    <Logo />
                </div>
            </div>
            <section>
                <div className="row">
                    <div className="col">
                        <h2>Reference</h2>
                        <SearchForm search={ search } setSearch={ setSearch }/>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <ReferenceCategory
                            title="Declarative API"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("declarative"))
                            }
                        />
                        <ReferenceCategory
                            title="InteractiveQuery / Filter"
                            search={ search }
                            docs={ docs }
                            names={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("iquery"))

                            }
                        />
                        <ReferenceCategory
                            title="Domain-Object Helpers"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("domain"))

                            }
                        />
                        <ReferenceCategory
                            title="Process"
                            search={ search }
                            docs={ docs }
                            names={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("process"))

                            }
                        />
                    </div>
                    <div className="col">
                        <ReferenceCategory
                            title="Components"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.components
                                    .map( name => docs.docs[name])
                            }
                        />
                        <ReferenceCategory
                            title="Hooks"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.hooks
                                    .map( name => docs.docs[name])
                            }
                        />
                        <ReferenceCategory
                            title="Classes"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.classes
                                    .map( name => docs.docs[name])
                            }
                        />
                    </div>
                    <div className="col">
                        <ReferenceCategory
                            title="Websocket"
                            search={ search }
                            docs={ docs }
                            names={
                                Object.values(docs.docs)
                                    .filter(filterByCategory("websocket"))

                            }
                        />
                        <ReferenceCategory
                            title="Configuration"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.utils
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory("config"))
                            }
                        />
                        <ReferenceCategory
                            title="Static Utils"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.utils
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory())
                            }
                        />
                        <ReferenceCategory
                            title="Functions"
                            search={ search }
                            docs={ docs }
                            names={
                                docs.functions
                                    .map( name => docs.docs[name])
                                    .filter(filterByCategory())

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
    const staticProps = await getPageDefaults({
        title: "Main Page"
    },
        false,
        false,
        true
    );

    //console.log("MAIN: staticProps = ", staticProps)

    const { docs } = staticProps.props;

    // filter for main page
    staticProps.props.docs = {
        ... docs,

        docs: (function (docs) {

            const out = {};
            for (let name in docs)
            {
                if (docs.hasOwnProperty(name))
                {
                    out[name] = {
                        "name": name,
                        "group": "CLASS",
                        "category": docs[name].category,
                        "link": docs[name].link
                    }
                }
            }
            return out;

        })(docs.docs),


        handwritten: docs.handwritten.map( hw => (
            {
                ... hw,
                content: null,
                toc: {
                    title: hw.toc.title
                }
            }
        ))
    }

    return staticProps;
}

