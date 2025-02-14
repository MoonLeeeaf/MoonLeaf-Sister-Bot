export default function readableStreamAsBuffer(readdableStream) {
    return new Promise((res, rej) => {
        let ls = []
        readdableStream.on('error', rej)
        readdableStream.on('data', (data) => ls.push(data))
        readdableStream.on('end', () => res(Buffer.concat(ls)))
    })
}
