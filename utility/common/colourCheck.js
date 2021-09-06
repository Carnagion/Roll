module.exports = function isColour(string)
{
    return /^#[0-9A-F]{6}$/i.test(string);
}