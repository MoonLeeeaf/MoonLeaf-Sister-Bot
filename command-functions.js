import TelegramBot from "node-telegram-bot-api"
import fetchAsBuffer from "./lib/fetchAsBuffer.js"
import getImageBase64 from "./lib/getImageBase64.js"
import readableStreamAsBuffer from "./lib/readableStreamAsBuffer.js"
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice, sendDocument } from './MessagesQuerier.js'
import { requestChat, chatResultToText, replyOrCommandToChat } from './ollama-chat.js'
import configMeta from './configMeta.js'

export default [
    {
        match: /msg info$/,
        usage: 'msg info',
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
        match: /msg delete$/,
        usage: 'msg delete',
        help: '(回复) 刪除消息',
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
        match: /repeat ([\s\S]*)/,
        usage: 'repeat [消息]',
        help: '重複消息',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await sendMessage(msg.chat.id, match[1], {
                parse_mode: "MarkdownV2",
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
            if (!msg.photo) throw new Error('请在调用此指令的同时携带一张图片')
            await sendDocument(msg.chat.id, Buffer.from(await getImageBase64(await bot.getFileStream(msg.photo[msg.photo.length - 1].file_id))), {
                reply_to_message_id: msg.message_id,
                parse_mode: 'HTML',
            }, {
                filename: 'base64_of_this_image.txt',
                contentType: 'text/plain',
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
        match: /chat ([0-9]+) ([\s\S]*)/,
        usage: 'chat <選擇的模型序號> <对话内容>',
        help: '启动新的 AI 聊天对话, 直接回复(使用关键词 NOREPLY 以规避)或以此命令回复 AI 回答的内容以上下文聊天, 支持多個模型, 一般選擇 1 即可',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await replyOrCommandToChat(bot, msg, match)
        }
    },
    {
        match: /chat list$/,
        usage: 'chat list',
        help: '獲取所有可用模型列表',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await sendMessage(msg.chat.id, JSON.stringify(configMeta.ollama.models), {
                reply_to_message_id: msg.message_id,
            })
        }
    },
    {
        match: /exit/,
        usage: 'exit',
        help: '退出群聊',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            
        }
    },
]
