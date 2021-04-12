import React from "react"
import MarkdownSection from "./MarkdownSection";

function MarkdownPage({docs, path})
{
    const hw = docs.handwritten.find( hw => hw.src === path);

    if (!hw)
    {
        throw new Error(
            "Could not find snippet: " + path + ".\n" +
            "Did you register is in the automaton-js-doc.config.js?"
        );
    }

    return (
        <MarkdownSection
            name="config"
            markdown={ hw }
        />
    )
}

export default MarkdownPage;
