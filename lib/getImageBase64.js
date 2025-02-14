import readableStreamAsBuffer from "./readableStreamAsBuffer.js"
import fs from 'node:fs'

/**
 * 获取图片的 Base64 文本
 * @param { Buffer | NodeJS.ReadableStream | String } img
 */
export default async function getImageBase64(img) {
    let imgBuffer
    if (img instanceof String)
        imgBuffer = fs.readFileSync(img)
    else if (img instanceof Buffer)
        imgBuffer = img
    else
        imgBuffer = await readableStreamAsBuffer(img)

    return imgBuffer.toString('base64')
}
