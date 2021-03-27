import Layout from "../components/Layout";
import cx from "classnames";
import { getPageDefaults } from "../service/docs";
import TOCLink from "../components/TOCLink";
import { useState } from "react";
import { useRouter } from "next/router";
import * as PropTypes from "prop-types";

const Category = ({title, docs, names : namesFromProps, search}) => {

    const names = search ?
        namesFromProps.filter(name => name.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) >= 0) :
        namesFromProps;


    return (
        <>
            <h3>
                {
                    title
                }
            </h3>
            {
                !names.length && "---"
            }
            {
                names.map(name => <TOCLink key={name} doc={docs.docs[name]}/>)
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
                            title="Components"
                            docs={docs}
                            search={ search }
                            names={ docs.components }
                        />
                    </div>
                    <div className="col">
                        <Category
                            title="Hooks"
                            docs={docs}
                            search={ search }
                            names={ docs.hooks }
                        />
                        <Category
                            title="Classes"
                            docs={docs}
                            search={ search }
                            names={ docs.classes }
                        />
                        <Category
                            title="Utils"
                            docs={docs}
                            search={ search }
                            names={ docs.utils }
                        />
                    </div>
                    <div className="col">
                        <Category
                            title="Functions"
                            docs={docs}
                            search={ search }
                            names={ docs.functions }
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

