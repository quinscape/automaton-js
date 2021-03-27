import React from "react"
import MarkdownSection from "./MarkdownSection";

function MarkdownPage({docs, path})
{
    const hw = docs.handwritten.find( hw => hw.src === path);

    if (!hw)
    {
        throw new Error("Could not find snippet: " + path);
    }

    return (
        <MarkdownSection
            name="config"
            content={ hw.content }
        />
    )
}

export default MarkdownPage;
