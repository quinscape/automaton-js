import config from "../automaton-js-doc.config";
import { promises as fs } from "fs";
import cx from "classnames"
import path from "path";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { MDXProvider } from "@mdx-js/react";
import MDX from "@mdx-js/runtime";
import React from "react"
import Highlight, { defaultProps } from "prism-react-renderer"
import github from "prism-react-renderer/themes/github";

import frontmatter from "@github-docs/frontmatter";
import validateRule from "./validateRule";

import InjectionDiagram from "../components/injection.svg"
import DomainQLDiagram from "../components/domainql.svg"
import AutomatonTemplatePNG from "../public/media/automaton-template.png"
import { useRouter } from "next/router";

function AutomatonTemplateScreenshot(props)
{
    //const router = useRouter();

    return (
        <img
            src={ /*router.basePath +*/ "/media/automaton-template.png" }
            alt="Screenshot of the automaton-template homepage on github"
        />
    )
}

function CodeBlock({children, className})
{

    const m = /language-([a-z]+)/.exec(className);
    const language = m  ? m[1] : "js";

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
        <table className={ cx( className, "table table-bordered table-hover" )} { ... rest }>
            {
                children
            }
        </table>
    )
}


function createStub(str)
{
    return str.toLocaleLowerCase()
            .replace(/ /g, "-")
            // just remove URL reserved and unsafe characters from the name
            .replace(/[<>:?\/#\[@!$&'()*+,;="%{}|\\^`]/g, "")
}


class TOC
{
    constructor()
    {
        this.data = {
            name: "ROOT",
            level: 0,
            headings: []

        }
        this.parents = [];
        this.current = this.data;
    }

    register(level, kids)
    {
        const stub = createStub(kids);
        if (level === this.current.level)
        {
            const newSub = {
                level: this.current.level,
                name: stub,
                title: kids,
                headings: []
            };
            this.parents[0].headings.push(newSub);
            this.current = newSub;


            return "]]\n[[section##" + stub + "\n";
        }
        else if (level < this.current.level)
        {
            let h = this.current;
            let s = "";
            while (level < h.level)
            {
                h = this.parents.shift();
                s += "]]\n";
            }
            this.current = h;


            const newSub = {
                level: this.current.level,
                name: stub,
                title: kids,
                headings: []
            };
            this.parents[0].headings.push(newSub);
            this.current = newSub;
            return "[[section##" + stub + "\n";
        }
        else
        {

            const newSub = {
                level,
                name: stub,
                title: kids,
                headings: []
            };
            this.current.headings.push(newSub)
            this.parents.unshift(this.current);
            this.current = newSub;

            return "[[section##" + stub + "\n";
        }

    }
}

const TOCContext = React.createContext( null );

function createHeading(level)
{
    const Component = function({children})
    {
        return (
            <TOCContext.Consumer>
                {

                    toc => {
                        return React.createElement(React.Fragment, null,
                            toc.register(level, children),
                            React.createElement("h" + level, null, children)
                        )

                    }
                }

            </TOCContext.Consumer>
        )
    };

    Component.displayName = "Heading" + level;

    return Component
}


const components = {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    a: MarkdownLink,
    code: CodeBlock,
    table: Table,

    InjectionDiagram,
    DomainQLDiagram,
    AutomatonTemplateScreenshot
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


function serializeFrontMatter(fm)
{

    const newFm = {};
    for (let name in fm)
    {
        if (fm.hasOwnProperty(name))
        {
            const value = fm[name];
            newFm[name] = value instanceof Date ? value.toISOString() : value
        }
    }

    return newFm;
}


function replaceSectionMarkers(content)
{
    return content
        .replace(/\[\[section##(.*?)\n/g, "<section id=\"$1\">\n")
        .replace(/]]\n/g, "</section>\n")
}



export function processMarkdownSnippets(markdownSnippets)
{
    return markdownSnippets.map(
        (markdown, idx) => {

            try
            {
                const { data = {}, content, errors } = frontmatter(markdown)

                if (errors.length)
                {
                    throw new Error("Frontmatter parser errors: " + JSON.stringify(errors));

                }

                const toc = new TOC();

                const hw = config.handwritten[idx];
                const snippet = {

                    // copy over the static config
                    ... hw,

                    frontmatter: serializeFrontMatter(data),

                    // and complete it with the rendered markup for each snippet
                    content: renderToStaticMarkup(
                        <TOCContext.Provider value={ toc }>
                            <MDXProvider
                                components={components}
                            >
                                <MDX>
                                    {
                                        content
                                    }
                                </MDX>
                            </MDXProvider>
                        </TOCContext.Provider>
                    )
                };

                snippet.content = replaceSectionMarkers(snippet.content);

                if (toc.data.headings.length > 1)
                {
                    if (toc.data.headings[0].level === 1)
                    {
                        throw new Error("There should only be one H1 / top level heading in the markdown: " + hw.src );
                    }

                    snippet.toc = {
                        name: hw.src,
                        title: frontmatter.title || null,
                        level: 1,
                        headings: toc.data.headings
                    }
                }
                else
                {
                    snippet.toc = toc.data.headings[0];
                }


                return snippet;

            }
            catch(e)
            {
                throw new Error("Error processing markdown: " + markdown + "\n\nERROR: " + e.stack);
            }
        }
    );
}


