const supportsGetBoundingClientRect = typeof document.createElement("div").getBoundingClientRect === "function";

let offset;
if (supportsGetBoundingClientRect)
{
    offset = el => el.getBoundingClientRect();
}
else
{
    offset = function(el) {
        let x = 0, y = 0;
        do {
            x += el.offsetLeft - el.scrollLeft;
            y += el.offsetTop - el.scrollTop;
        }
        while (el = el.offsetParent);

        return { "left": x, "top": y }
    }
}

export default offset;
