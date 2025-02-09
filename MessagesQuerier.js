import TelegramBot from 'node-telegram-bot-api'
import io from './lib/io.js'
import { log, loge, logw } from './lib/log.js'

/** @type { TelegramBot } */
let globalBot

class MessagesQuerier {
    /**
     * 初始化
     * @param { TelegramBot } bot 
     */
    static init(bot) {
        globalBot = bot
        bot.on('message', (msg, meta) => {
            log(`收 ${messageInfo(msg)}`)
            io.mkdirs(`data/${msg.chat.id}`)
            this.add(msg)
        })
    }
    static add(msg) {
        io.open(`data/${msg.chat.id}/${msg.message_id}`, 'w').writeAllJson(msg).close()
        return msg
    }
    static addSelf(msg) {
        log(`发 ${messageInfo(msg)}`)
        io.open(`data/${msg.chat.id}/${msg.message_id}`, 'w').writeAllJson(msg).close()
        return msg
    }
    /**
     * 查询一条消息
     * @param { TelegramBot.ChatId } chatId 
     * @param { TelegramBot.MessageId } msgId 
     * @returns { TelegramBot.Message }
     */
    static query(chatId, msgId) {
        return io.open(`data/${chatId}/${msgId}`, 'r').readAllJsonAndClose()
    }
}

/**
 * 发送文字
 * @param { TelegramBot } bot 
 * @param { TelegramBot.ChatId } chatId
 * @param { String } msg
 * @param { TelegramBot.SendMessageOptions } [opinions] 
 * @returns { Promise<TelegramBot.Message> }
 */
async function sendMessage(chatId, msg, opinions = {}) {
    return MessagesQuerier.addSelf(await globalBot.sendMessage(chatId, msg, opinions))
}

/**
 * 发送图片
 * @param { TelegramBot } bot 
 * @param { TelegramBot.ChatId } chatId
 * @param { String | Buffer | Stream } image
 * @param { TelegramBot.SendPhotoOptions } [options]
 * @param { TelegramBot.FileOptions } [fileOptions]
 * @returns { Promise<TelegramBot.Message> }
 */
async function sendPhoto(chatId, image, opinions = {}, fileOptions = {}) {
    return MessagesQuerier.addSelf(await globalBot.sendPhoto(chatId, image, opinions, fileOptions))
}

/**
 * 发送语音
 * @param { TelegramBot } bot 
 * @param { TelegramBot.ChatId } chatId
 * @param { String | Buffer | Stream } voice
 * @param { TelegramBot.SendVoiceOptions } [options]
 * @param { TelegramBot.FileOptions } [fileOptions]
 * @returns { Promise<TelegramBot.Message> }
 */
async function sendVoice(chatId, voice, opinions = {}, fileOptions = {}) {
    return MessagesQuerier.addSelf(await globalBot.sendVoice(chatId, voice, opinions, fileOptions))
}

/**
 * 
 * @param { TelegramBot.Message } msg 
 */
function messageInfo(msg) {
    return `<${msg.chat.type}> [${msg.chat.username || msg.chat.title}(${msg.chat.id})] -> ${
        msg.text || ''
    }${
        msg.audio ? `音频 [duration=${msg.voice.duration},title=${msg.audio.title},id=${msg.audio.file_id},mimeType=${msg.audio.mime_type}]` : ''
    }${
        msg.photo ? (function() {
            let a = ''
            for (let i of msg.photo) {
                a += `图片 [id=${i.file_id},width=${i.width},height=${i.height}]\n`
            }
            return a.trim()
        })() : ''
    }${
        msg.voice ? `语音 [duration=${msg.voice.duration},id=${msg.voice.file_id},mimeType=${msg.voice.mime_type}]` : ''
    }${
        msg.video ? `视频 [duration=${msg.video.duration},id=${msg.video.file_id},mimeType=${msg.video.mime_type},width=${i.width},height=${i.height}]` : ''
    }`
}

export {
    MessagesQuerier,
    sendMessage,
    sendVoice,
    sendPhoto,
    messageInfo,
}
