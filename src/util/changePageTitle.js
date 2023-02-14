const PAGE_TITLE = document.title;

export default function changePageTitle(text) {
    if (typeof text !== "string" || text === "") {
        document.title = PAGE_TITLE;
    } else {
        document.title = `${PAGE_TITLE} - ${text}`;
    }
}