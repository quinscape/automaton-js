import Layout from "../../components/Layout";
import React from "react";
import MarkdownTOC from "../../components/MarkdownTOC";
import MarkdownDiv from "../../components/MarkdownDiv";
import { EXPLANATION, getStaticPathsByPrefix, getMarkdownPropsByPrefix } from "../../service/markdown-filter";

export default function ExplanationPage(props) {
    const { markdown } = props;

    return (
        <Layout
            largeSidebar={ true }
            sidebar={() => (
                (
                    <>
                        <h5>
                            { markdown.toc.title }
                        </h5>
                        <MarkdownTOC toc={ markdown.toc }/>

                    </>
                )

            )}
        >
            <div className="row">
                <div className="col">

                    <MarkdownDiv
                        markdown={ markdown }
                    />
                </div>
            </div>
        </Layout>
    )
}


export async function getStaticProps(context)
{
    return import("../../service/docs")
        .then(
            ({ getDocsData }) => {
                return getDocsData([])
            }
        )
        .then( data => {

            const { name } = context.params;

            return getMarkdownPropsByPrefix(data.handwritten, EXPLANATION, name)
    })

}

export async function getStaticPaths()
{
    return import("../../service/docs")
        .then(
            ({ getDocsData }) => {
                return getDocsData([])
            }
        )
        .then( data => {

            return {
                paths: getStaticPathsByPrefix(data.handwritten, EXPLANATION),
                fallback: false
            }
        }, err => console.error("DOCS DATA ERROR", err))
}
