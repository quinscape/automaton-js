import config from "../automaton-js-doc.config";
import { promises as fs } from "fs";
import cx from "classnames"
import path from "path";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { MDXProvider } from "@mdx-js/react";
import MDX from "@mdx-js/runtime";
import React from "react"
import Highlight, { defaultProps } from "prism-react-renderer"
import github from 'prism-react-renderer/themes/github';

import frontmatter from "@github-docs/frontmatter";
import validateRule from "./validateRule";


function CodeBlock({children, className})
{


    const language = className ? className.replace(/language-/, "") : "js";

    return (
        <Highlight
            { ... defaultProps }
            code={ children.replace(/\n$/, "") }
            language={ language }
            theme={ github }
        >
            {
                ({className, style, tokens, getLineProps, getTokenProps}) => (
                    <pre
                        className={
                            cx(
                                className,
                                "p-3"
                            )
                        }
                        style={ style }
                    >
                        {
                            tokens.map((line, i) => (
                                    <div
                                        key={i}
                                        {...getLineProps({line, key: i})}
                                    >
                                        {
                                            line.map(
                                                (token, key) => (
                                                    <span key={key} {...getTokenProps({token, key})} />
                                                )
                                            )
                                        }
                                    </div>
                                )
                            )
                        }
                    </pre>
                )
            }
        </Highlight>
    )
}


function MarkdownLink({href, children, ... rest})
{

    href = href[0] === "/" ? (config.basePath || "") + href : href;

    return (
        <a
            className="btn btn-link btn-sm"
            href={href}
            { ... rest }
        >
            {children}
        </a>
    )
}

function Table({children, className, ... rest})
{

    return (
        <table className={ cx( className, "table table-striped table-hover" )} { ... rest }>
            {
                children
            }
        </table>
    )
}


const components = {
    a: MarkdownLink,
    code: CodeBlock,
    table: Table
};



export async function loadSnippets(docs)
{
    return Promise.all(
        config.handwritten.map(
            hw => {

                validateRule(docs, hw);

                return fs.readFile(
                    path.resolve(
                        process.cwd(), "./snippets/", hw.src
                    ),
                    "utf8"
                );
            }
        )
    );
}


export function processMarkdownSnippets(markdownSnippets)
{
    return markdownSnippets.map(
        (markdown, idx) => {


            const { data, content, errors } = frontmatter(markdown)

            return ({

                // copy over the static config
                ...config.handwritten[idx],

                frontmatter: data,

                // and complete it with the rendered markup for each snippet
                content: renderToString(
                    <MDXProvider
                        components={components}
                    >
                        <MDX>
                            {
                                content
                            }
                        </MDX>
                    </MDXProvider>
                )
            });
        }
    );
}
