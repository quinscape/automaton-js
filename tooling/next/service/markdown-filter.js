import { hasNoRule } from "./validateRule";

export const EXPLANATION = "explanation-";
export const DOCUMENTATION = "documentation-";
export const HOWTO = "howto-";


export function extractMarkdownToName(hw, prefix)
{
    return hw.src.substr(prefix.length, hw.src.length - prefix.length - 3);
}


export function getPathsByPrefix(handwritten, prefix)
{
    return handwritten
        .filter(hw => hw.src.indexOf(prefix) === 0 && hasNoRule(hw))
        .map(hw => extractMarkdownToName(hw, prefix))
}


export function getStaticPathsByPrefix(handwritten, prefix)
{
    return getPathsByPrefix(handwritten, prefix)
        .map(name => (
            {
                params: {
                    name
                }
            }
        ))
}


export function findMarkdownBySource(handwritten, src)
{
    return handwritten.find(hw => hw.src === src);
}

export function findMarkdownIndexBySource(handwritten, src)
{
    for (let i = 0; i < handwritten.length; i++)
    {
        const hw = handwritten[i];
        if (hw.src === src)
        {
            return i;
        }
    }
    return -1;
}

export function getMarkdownTitle(hw)
{
    return (hw.frontmatter && hw.frontmatter.title) || (hw.toc && hw.toc.title) || "Untitled"
}


export function getMarkdownPropsByPrefix(handwritten, prefix, name)
{
    const hwWithPrefix = handwritten.filter( hw => hw.src.indexOf(prefix) === 0 )

    const src = prefix + name + ".md";
    const index = findMarkdownIndexBySource(hwWithPrefix, src);
    const hw = hwWithPrefix[index];
    if (!hw)
    {
        throw new Error("Could not find handwritten doc with name = " +  src);
    }

    let prev = null;
    if (DOCUMENTATION && index > 0)
    {

        const prevMarkdown = hwWithPrefix[index - 1];
        prev= {
            ... prevMarkdown,
            content: null,
            name: extractMarkdownToName(prevMarkdown, prefix),
            title: getMarkdownTitle(prevMarkdown)
        };

    }
    let next = null;
    if (prefix === DOCUMENTATION && index < hwWithPrefix.length - 1)
    {

        const nextMarkdown = hwWithPrefix[index + 1];
        next = {
            ... nextMarkdown,
            content: null,
            name: extractMarkdownToName(nextMarkdown, prefix),
            title: getMarkdownTitle(nextMarkdown)
        }
    }

    return {
        props: {
            name,
            markdown: hw,
            title: getMarkdownTitle(hw),
            prev,
            next
        }
    }

}
