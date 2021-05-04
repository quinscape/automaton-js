import Layout from "../components/Layout";
import ReactDocSection from "../components/ReactDocSection";
import { getPageDefaults } from "../service/docs";
import JsDocSection, { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";


export default function Classes(props)
{
    const { docs } = props;

    return (
        <Layout
            {...props}
            sidebar={ () => (
                (
                    <>
                        <h5>
                            Classes
                        </h5>
                        <ul className="markdown-doc list-unstyled">
                        {
                            docs.classes.map(name => (<TOCLink key={name} docs={ docs } name={ name }/>))
                        }
                        </ul>
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">
                    <h1>Classes</h1>
                    {
                        docs.classes.map(name => {

                            const doc = docs.docs[name];

                            return (
                                <JsDocClassSection
                                    key={ name }
                                    name={ name }
                                    doc={ doc }
                                    docs={ docs }
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
            title: "Classes"
        },
        [ Group.CLASS ]
    );
}

