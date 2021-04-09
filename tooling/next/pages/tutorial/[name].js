import Layout from "../../components/Layout";
import React from "react";
import MarkdownTOC from "../../components/MarkdownTOC";
import MarkdownDiv from "../../components/MarkdownDiv";
import {
    DOCUMENTATION,
    getStaticPathsByPrefix,
    getMarkdownPropsByPrefix,
    getMarkdownTitle
} from "../../service/markdown-filter";
import { useRouter } from "next/router";

export default function TutorialPage(props) {
    const { markdown, prev, next } = props;

    const router = useRouter();

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
            footer={ () => (
                <div className="row">
                    <div className="col">
                        {
                            !!prev && (
                                <a
                                    className="btn btn-link"
                                    href={ router.basePath + "/tutorial/" + prev.name }
                                >
                                    {
                                        "Previous: " + getMarkdownTitle(prev)
                                    }
                                </a>
                            )
                        }
                    </div>
                    <div className="col d-flex justify-content-center">
                        <a
                            className="btn btn-link"
                            href={ router.basePath + "/" }
                        >
                            Home
                        </a>
                    </div>
                    <div className="col d-flex justify-content-end">
                        {
                            !!next && (
                                <a
                                    className="btn btn-link"
                                    href={ router.basePath + "/tutorial/" + next.name }
                                >
                                    {
                                        "Next: " + getMarkdownTitle(next)
                                    }

                                </a>
                            )
                        }
                    </div>
                </div>
            )

            }
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

            return getMarkdownPropsByPrefix(data.handwritten, DOCUMENTATION, name)
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
                paths: getStaticPathsByPrefix(data.handwritten, DOCUMENTATION),
                fallback: false
            }
        }, err => console.error("DOCS DATA ERROR", err))
}
