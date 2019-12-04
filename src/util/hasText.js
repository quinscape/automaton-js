export default function hasText(s)
{
    return s ? /[^\s]/.test(s) : false
}
