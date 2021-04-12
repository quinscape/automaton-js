function MarkdownSection({name, markdown})
{
    return (
        <section
            id={ name }
            dangerouslySetInnerHTML={{
                __html: markdown.content
            }}
        />
    );
}

export default MarkdownSection
