/* 
 * Simple Log Library
 * Author - @MoonLeeeaf <https://github.com/MoonLeeeaf>
 */

import color from './colors.js'

/**
 * 控制台输出
 * @param { String } t 
 */
const log = (t) => {
    console.log("[" + new Date().toLocaleTimeString('en-US', { hour12: false }) + "] " + t)
}

/**
 * 控制台输出(错误)
 * @param { String } t 
 */
const loge = (t) => {
    log(`[E] ${color.red + t + color.none}`)
}

/**
 * 控制台输出(警告)
 * @param { String } t 
 */
const logw = (t) => {
    log(`[W] ${color.yellow + t + color.none}`)
}

export { log, loge, logw }
