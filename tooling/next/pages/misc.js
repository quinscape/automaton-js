import Layout from "../components/Layout";
import ReactDocSection from "../components/ReactDocSection";
import { getPageDefaults } from "../service/docs";
import JsDocSection, { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";

/*

 */

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
                            Utils
                        </h5>
                        {
                            docs.utils.map(name => (<TOCLink key={name} doc={docs.docs[name]}/>))

                        }
                        <h5>
                            Functions
                        </h5>
                        {
                            docs.functions.map(name => (<TOCLink key={name} doc={docs.docs[name]}/>))

                        }
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <h1>Static Util Objects</h1>
                    {
                        docs.utils.map(name => {

                            const doc = docs.docs[name];

                            return (
                                <JsDocClassSection
                                    key={ name }
                                    name={ name }
                                    doc={ doc }
                                    docs={ docs }
                                    complex={ true }
                                />
                            )
                        })
                    }

                    <h1>Functions</h1>
                    {
                        docs.functions.map(name => {

                            const doc = docs.docs[name];

                            return (
                                <JsDocFunctionSection
                                    key={ name }
                                    name={ name }
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
        title: "Static Utils and Functions"
    })
}

