import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory } from "../service/docs-filter";

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
                                .filter(filterByCategory())
                                .map(
                                    doc => (
                                        <TOCLink
                                            key={doc.name}
                                            doc={doc}
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
                                .filter(filterByCategory())
                                .map(
                                    doc => (
                                        <TOCLink
                                            key={doc.name}
                                            doc={doc}
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
                            .filter(filterByCategory())
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
                            .filter(filterByCategory())
                            .map(doc => (
                                    <JsDocClassSection
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
        title: "Static Utils and Functions"
    })
}

