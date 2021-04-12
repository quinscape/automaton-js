import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory } from "../service/docs-filter";

export default function SchemaFunctions(props)
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
                        {
                            docs.functions
                                .map( name => docs.docs[name])
                                .filter(filterByCategory("schema"))
                                .map(doc => (<TOCLink key={doc.name} doc={ doc }/>))
                        }
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
                            .filter(filterByCategory("schema"))
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
                </div>
            </div>
        </Layout>
    )
}

export async function getStaticProps(context)
{
    return getPageDefaults({
        title: "Schema / GraphQL Type Functions"
    })
}

