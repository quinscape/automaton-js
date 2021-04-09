import Layout from "../components/Layout";
import { getPageDefaults } from "../service/docs";
import { JsDocClassSection, JsDocFunctionSection } from "../components/JsDocSection";
import TOCLink from "../components/TOCLink";
import React from "react";
import { filterByCategory, filterPageDefaults } from "../service/docs-filter";
import Group from "../service/Group";

export default function ConfigurationFunctions(props)
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
                            Automaton Configuration
                        </h5>
                        {
                            docs.utils.map( name => (<TOCLink key={name} docs={ docs } name={ name }/>))
                        }
                    </>
                )

                )}
        >
            <div className="row">
                <div className="col">
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
            title: "Automaton Configuration"
        },
        [ Group.UTIL ],
        "config"
    );
}

