function MarkdownDiv({markdown})
{
    return (
        <div
            dangerouslySetInnerHTML={{
                __html: markdown.content
            }}
        />
    );
}

export default MarkdownDiv
