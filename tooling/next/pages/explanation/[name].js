import Layout from "../../components/Layout";
import { getDocsData, getPageDefaults } from "../../service/docs";
import React from "react";
import MarkdownSection from "../../components/MarkdownSection";
import { hasNoRule } from "../../service/validateRule";

export default function Explanation(props) {
    const {name, content} = props;

    return (
        <Layout
            sidebar={() => (
                (
                    <>
                        <h5>
                            Explanation: WIP
                        </h5>
                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <MarkdownSection
                        name={ name }
                        markdown={ content }
                    />
                </div>
            </div>
        </Layout>
    )
}

const EXPLANATION = "explanation-";


export async function getStaticProps({ params })
{
    const { name } = params;

    const data = await getDocsData();

    const path = EXPLANATION + name + ".md"

    const hw = data.handwritten.find(hw => hw.src === path);

    if (!hw)
    {
        throw new Error("Could not find handwritten doc with path = " + path);
    }

    return {
        props: {
            ... hw,
            name,
            title: hw.frontmatter.title
        }
    }
}

export async function getStaticPaths()
{
    const data = await getDocsData();

    return {
        paths: data.handwritten
            .filter( hw => hw.src.indexOf(EXPLANATION) === 0 && hasNoRule(hw) )
            .map(
                hw => ({
                    params : {
                        name: hw.src.substr(EXPLANATION.length, - 3)
                    }
                })
            ),
        fallback: false
    }
}
