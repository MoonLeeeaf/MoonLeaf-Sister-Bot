export default async function fetchAsBuffer(url, param) {
    let r = await fetch(url, param)
    let d = await r.arrayBuffer()
    return Buffer.from(d)
}
