import TelegramBot from "node-telegram-bot-api"
import fetchAsBuffer from "./lib/fetchAsBuffer.js"
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'

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
        match: /ollama ([\s\S]*)/,
        usage: 'ollama <对话内容>',
        help: '([回复]) 启动一个 Ollama 聊天对话',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            const model = 'deepseek-r1:1.5b'
            async function requestChat(messages) {
                const re = await fetch(`http://localhost:11434/api/chat`, {
                    method: 'POST',
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        stream: false,
                    })
                })
                return await re.json()
            }
            function chatResultToText(o) {
                let think = /<think>([\s\S]*)<\/think>/.exec(o.message.content)[1].trim()
                let content = o.message.content.replace(/<think>[\s\S]*<\/think>/, '').trim()
                return `<blockquote expandable>[Ollama Chat]\n模型: ${model}\n已深度思考 ${Math.round(o.eval_duration / 1e9)}s\n思考过程如下\n${think}<\/blockquote>${content}`
            }
            /**
             * @param { TelegramBot.MessageId } msgId 
             * @returns { TelegramBot.Message }
             */
            function queryMessage(msgId) {
                return MessagesQuerier.query(msg.chat.id, msgId)
            }

            if (msg.reply_to_message == null) {
                await sendMessage(msg.chat.id, chatResultToText(await requestChat([{
                    role: 'user',
                    content: match[1],
                }])), {
                    reply_to_message_id: msg.message_id,
                    parse_mode: 'HTML',
                })
            } else {
                // 一个个回复寻找 拼凑聊天记录
                let messages = []
                let parent_msg = msg

                const myId = (await bot.getMe()).id

                do {
                    if (parent_msg.from.id == myId)
                        messages.unshift({
                            role: 'assistant',
                            content: /[\s\S]*思考过程如下\n([\s\S]*)/.exec(parent_msg.text)[1],
                        })
                    else
                        messages.unshift({
                            role: 'user',
                            content: / ollama ([\s\S]*)/.exec(parent_msg.text)[1],
                        })

                    if (parent_msg.reply_to_message == null)
                        break
                    parent_msg = queryMessage(parent_msg.reply_to_message.message_id)
                } while (parent_msg != null)

                await sendMessage(msg.chat.id, chatResultToText(await requestChat(messages)), {
                    reply_to_message_id: msg.message_id,
                    parse_mode: 'HTML',
                })
            }
        }
    },
]
