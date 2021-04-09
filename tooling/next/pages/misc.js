import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory, filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";

export default function MiscFunctions(props) {
    const {docs} = props;

    return (
        <Layout
            {...props}
            sidebar={() => (
                (
                    <>
                        <h5>
                            Utils
                        </h5>
                        {
                            docs.utils
                                .map(name => docs.docs[name])
                                .map(
                                    doc => (
                                        <TOCLink
                                            key={doc.name}
                                            docs={ docs }
                                            name={ doc.name }
                                        />
                                    )
                                )
                        }
                        <h5>
                            Functions
                        </h5>
                        {
                            docs.functions
                                .map(name => docs.docs[name])
                                .map(
                                    doc => (
                                        <TOCLink
                                            key={doc.name}
                                            docs={ docs }
                                            name={ doc.name }
                                        />
                                        )
                                )

                        }
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <h1>Static Util Objects</h1>
                    {
                        docs.utils
                            .map(name => docs.docs[name])
                            .map(doc => (
                                    <JsDocClassSection
                                        key={doc.name}
                                        name={doc.name}
                                        doc={doc}
                                        docs={docs}
                                        complex={true}
                                    />
                                )
                            )
                    }

                    <h1>Functions</h1>
                    {
                        docs.functions
                            .map(name => docs.docs[name])
                            .map(doc => (
                                    <JsDocFunctionSection
                                        key={doc.name}
                                        name={doc.name}
                                        doc={doc}
                                        docs={docs}
                                        standalone={true}
                                    />
                                )
                            )
                    }
                </div>
            </div>
        </Layout>
    )
}


export async function getStaticProps(context)
{
    return getPageDefaults({
            title: "Static Utils and Functions",
        },
        [ Group.FUNCTION, Group.UTIL ],
        null
    );
}

