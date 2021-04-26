import config from "../automaton-js-doc.config";
import fsync, { promises as fs } from "fs";
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

import useViewIntersect from "../components/useViewIntersect";
import InjectionDiagram from "../components/injection.svg"
import DomainQLDiagram from "../components/domainql.svg"
import AutomatonTemplatePNG from "../public/media/automaton-template.png"
import { useRouter } from "next/router";

import { fsyncSync } from "fs";
import undefinedsToNull from "./undefinedsToNull";

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
        this.isOpen = false;
    }

    register(section)
    {
        const level = section.level;
        const title = section.title;
        const stub = section.stub;

        if (level === this.current.level)
        {
            const newSub = {
                level: this.current.level,
                name: stub,
                title,
                headings: []
            };
            this.parents[0].headings.push(newSub);
            this.current = newSub;
        }
        else if (level < this.current.level)
        {
            let h = this.current;
            while (level < h.level)
            {
                h = this.parents.shift();
            }
            this.current = h;

            const newSub = {
                level: this.current.level,
                name: stub,
                title,
                headings: []
            };
            this.parents[0].headings.push(newSub);
            this.current = newSub;
        }
        else if (this.isOpen)
        {
            const newSub = {
                level,
                name: stub,
                title,
                headings: []
            };
            this.current.headings.push(newSub)
            this.parents.unshift(this.current);
            this.current = newSub;
        }
        else
        {
            this.isOpen = true;

            const newSub = {
                level,
                name: stub,
                title,
                headings: []
            };
            this.current.headings.push(newSub)
            this.parents.unshift(this.current);
            this.current = newSub;
        }

    }
}

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

function Section({children, title, level = 1})
{
    const sectionRef = useViewIntersect();
    return (
        <section
            ref={sectionRef}
        >
            <TOCContext.Consumer>
                {
                    toc => {
                        return React.createElement(React.Fragment, null,
                            toc.register(level, title),
                            React.createElement("h" + level, null, title)
                        )

                    }
                }
            </TOCContext.Consumer>
            {
                children
            }
        </section>
    );
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
    Section: Section,

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

function parseMarkdownSections(content) {
    // Windows newline fix
    content = content.replace(/\r/g, "");
    // ---
    const MARKDOWN_SECTIONS_REGEX = /<section>\s*(#+) (.*?)\n([\s\S]*?)<\/section>/img;
    const sections = [];
    let m;
    while ((m = MARKDOWN_SECTIONS_REGEX.exec(content)) != null) {
        const level = m[1].length;
        const title = m[2];
        const content = m[3];
        const stub = createStub(title);
        sections.push({
            stub,
            title,
            level,
            content
        });
    }
    return sections;
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

                // fsync.writeFileSync(`${process.cwd()}/MDAST_TREE_${hw.src}.json`, JSON.stringify(sections, null, 4), "utf8");
                const sections = parseMarkdownSections(content)
                    .map(
                        section => ({
                            ...section,
                            content: renderToStaticMarkup(
                                <MDXProvider
                                    components={components}
                                >
                                    <MDX>
                                        {
                                            section.content
                                        }
                                    </MDX>
                                </MDXProvider>
                            )
                        })
                    );

                sections.forEach(
                    section => toc.register(section)
                )

                const snippet = {

                    // copy over the static config
                    ... hw,

                    frontmatter: serializeFrontMatter(data),

                    sections
                };

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

                return undefinedsToNull(snippet);

            }
            catch(e)
            {
                throw new Error("Error processing markdown: " + markdown + "\n\nERROR: " + e.stack);
            }
        }
    );
}


