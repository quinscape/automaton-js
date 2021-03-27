function MarkdownSection({name, content})
{
    return (
        <section
            id={ name }
            dangerouslySetInnerHTML={{
                __html: content
            }}
        />
    );
}

export default MarkdownSection
