import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory, filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";

export default function Process(props)
{
    const { docs } = props;

    return (
        <Layout
            {...props}
            sidebar={ () => (
                (
                    <>
                        <h5>
                            Schema / GraphQL Type Functions
                        </h5>
                        <ul className="markdown-doc list-unstyled">
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

                    <h1>
                        Schema / GraphQL Type Functions
                    </h1>
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
            title: "Process-Related Functions",
        },
        [ Group.FUNCTION ],
        "process"
    );
}

