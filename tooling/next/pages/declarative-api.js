import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";
import MarkdownSection from "../components/MarkdownSection";
import { findMarkdownBySource } from "../service/markdown-filter";

export default function BrowserHelpers(props)
{
    const { docs } = props;

    return (
        <Layout
            {...props}
            sidebar={ () => (
                (
                    <>
                        <h5>
                            Declarative API
                        </h5>
                        {
                            docs.functions
                                .map( name => docs.docs[name])
                                .map(doc => (<TOCLink key={doc.name} docs={ docs } name={ doc.name }/>))
                        }
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <MarkdownSection
                        markdown={ findMarkdownBySource( docs.handwritten, "declarative-api.md")}
                    />
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
            title: "Declarative API"
        },
        [ Group.FUNCTION ],
        "declarative",
        ["declarative-api.md"]
    );
}

