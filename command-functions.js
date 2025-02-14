import TelegramBot from "node-telegram-bot-api"
import fetchAsBuffer from "./lib/fetchAsBuffer.js"
import readableStreamAsBuffer from "./lib/readableStreamAsBuffer.js"
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'
import { requestChat, chatResultToText, replyOrCommandToChat } from './ollama-chat.js'

export default [
    {
        match: /info/,
        usage: 'info',
        help: '(回复) 查阅所回复消息的结构',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            if (!msg.reply_to_message) throw new Error('请在调用此指令的同时回复一条有效的消息')
            await sendMessage(msg.chat.id, `${JSON.stringify(msg.reply_to_message)}`, {
                reply_to_message_id: msg.message_id,
            })
        }
    },
    {
        match: /base64/,
        usage: 'base64',
        help: '(携带图片) 图片转换为 base64 url',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            if (!msg.photo) throw new Error('请在调用此指令的同时携带至少一张图片')
            let text = ''
            for (let i of msg.photo) {
                text += '<blockquote expandable>' + readableStreamAsBuffer(bot.getFileStream(i.file_id)).toString('base64') + '</blockquote>\n'
            }
            text = text.trim()
            await sendMessage(msg.chat.id, text, {
                reply_to_message_id: msg.message_id,
                parse_mode: 'HTML',
            })
        }
    },
    {
        match: /看妹子/,
        usage: '看妹子',
        help: '看妹子图片',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await sendPhoto(msg.chat.id, await fetchAsBuffer("https://api.lolimi.cn/API/meizi/api.php?type=image"), {
                reply_to_message_id: msg.message_id,
            })
        }
    },
    {
        match: /网易云 ([0-9]+)/,
        usage: '网易云 [音乐ID]',
        help: '解析网易云音乐',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await sendVoice(msg.chat.id, await fetchAsBuffer(`https://music.163.com/song/media/outer/url?id=${match[1]}.mp3`), {
                reply_to_message_id: msg.message_id,
            })
        }
    },
    {
        match: /chat ([\s\S]*)/,
        usage: 'chat <对话内容>',
        help: '启动新的 AI 聊天对话, 直接回复或以此命令回复此对话以继续聊天(自动获取上下文)',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await replyOrCommandToChat(bot, msg, match)
        }
    },
]
