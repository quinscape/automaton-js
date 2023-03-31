/**
 * Downloads a file given as Data-URI
 *
 * @param {String} uri      data URI
 * @param {String} name     file name
 */
export default function downloadURI(uri, name)
{
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
