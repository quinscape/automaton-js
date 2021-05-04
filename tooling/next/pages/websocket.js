import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory, filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";

export default function BrowserHelpers(props)
{
    const { docs } = props;

    return (
        <Layout
            {...props}
            largeSidebar={ true }
            sidebar={ () => (
                (
                    <>
                        <h5>
                            Websocket Related Functions
                        </h5>
                        <ul className="markdown-doc list-unstyled">
                        {
                            docs.utils
                                .map( name => docs.docs[name])
                                .map(doc => (<TOCLink key={doc.name} docs={ docs } name={ doc.name }/>))
                        }
                        {
                            docs.functions
                                .map( name => docs.docs[name])
                                .map(doc => (<TOCLink key={doc.name} docs={ docs } name={ doc.name }/>))
                        }
                        </ul>
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <h1>Websocket Related Functions</h1>
                    {
                        docs.utils
                            .map( name => docs.docs[name])
                            .map(doc => {

                            return (
                                <JsDocClassSection
                                    key={ doc.name }
                                    name={ doc.name }
                                    doc={ doc }
                                    docs={ docs }
                                    complex={ false }
                                />
                            )
                        })
                    }
                    {
                        docs.functions
                            .map( name => docs.docs[name])
                            .map(doc => {

                            return (
                                <JsDocFunctionSection
                                    key={ doc.name }
                                    name={ doc.name }
                                    doc={ doc }
                                    docs={ docs }
                                    standalone={ true }
                                />
                            )
                        })
                    }
                </div>
            </div>
        </Layout>
    )
}

export async function getStaticProps(context)
{
    return getPageDefaults({
            title: "Websocket Related Functions"
        },
        [ Group.FUNCTION, Group.UTIL ],
        "websocket"
    );
}

