import Layout from "../components/Layout";
import ReactDocSection from "../components/ReactDocSection";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import Group from "../service/Group";
import { filterPageDefaults } from "../service/docs-filter";


export default function ComponentsAndHooks(props)
{
    const { docs } = props;

    return (
        <Layout
            {...props}
            sidebar={ () => (
                (
                    <>
                        <h5>
                            Components
                        </h5>
                        <ul className="markdown-doc list-unstyled">
                        {
                            docs.components.map(name => (<TOCLink key={name} docs={ docs } name={ name }/>))

                        }
                        </ul>
                        <h5>
                        Hooks
                        </h5>
                        <ul className="markdown-doc list-unstyled">
                        {
                            docs.hooks.map(name => (<TOCLink key={name} docs={ docs } name={ name }/>))

                        }
                        </ul>
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">
                    <h1>Components</h1>
                    {
                        docs.components.map(
                            name => (
                                <ReactDocSection
                                    key={name}
                                    name={name}
                                    data={docs.docs[name].reactDocGen}
                                    docs={ docs }
                                />
                            )
                        )
                    }
                    <h1>Hooks</h1>
                    {
                        docs.hooks.map(name => {

                            const doc = docs.docs[name];

                            return (
                                <section
                                    key={name}
                                    id={ name }
                                >
                                    <JsDocFunctionSection
                                        docs={ docs }
                                        name={name}
                                        doc={ doc }
                                        standalone={ true }
                                    />
                                </section>
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
            title: "React components and hooks"
        },
        [ Group.COMPONENT, Group.HOOK ]
    );
}

