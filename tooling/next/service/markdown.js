import config from "../automaton-js-doc.config";
import { promises as fs } from "fs";
import cx from "classnames"
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { MDXProvider } from "@mdx-js/react";
import MDX from "@mdx-js/runtime";
import React from "react"
import Highlight, { defaultProps } from "prism-react-renderer"


import github from 'prism-react-renderer/themes/github';

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


const components = {
    a: MarkdownLink,
    code: CodeBlock
};

const validRuleFields = new Set([
    "src",
    "into",
    "after",
    "replace"
])


function validateRule(docs, hw)
{
    if (!hw.src)
    {
        throw new Error("Need src key: " + JSON.stringify(hw));
    }

    let count = 0;
    const keys = Object.keys(hw);
    for (let i = 0; i < keys.length; i++)
    {
        const key = keys[i];
        if (!validRuleFields.has(key))
        {
            throw new Error("Invalid field '" + key + "': " + JSON.stringify(hw))
        }

        if (key !== "src")
        {
            const ref = hw[key];
            const target = docs.find(d => d.name === ref);
            if (!target)
            {
                throw new Error(
                    "Invalid reference '" + ref + "' in rule: " + JSON.stringify(hw)
                )
            }
        }

        count++;
    }

    if (count > 2)
    {
        throw new Error("Rule has more than one rule field: " + JSON.stringify(hw))
    }
}


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
                    "UTF-8"
                );
            }
        )
    );
}


export function processMarkdownSnippets(markdownSnippets)
{
    return markdownSnippets.map(
        (markdown, idx) => ({

            // copy over the static config
            ...config.handwritten[idx],

            // and complete it with the rendered markup for each snippet
            content: renderToStaticMarkup(
                <MDXProvider components={components}>
                    <MDX>
                        {
                            markdown
                        }
                    </MDX>
                </MDXProvider>
            )
        })
    );
}
