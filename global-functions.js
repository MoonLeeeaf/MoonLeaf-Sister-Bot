import io from "./lib/io.js"
const packageMeta = io.open('./package.json', 'r').readAllJsonAndClose()

import TelegramBot from "node-telegram-bot-api"
import { requestChat, chatResultToText, replyOrCommandToChat, detectOllamaChatKeyWord } from './ollama-chat.js'
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'
import { log, loge, logw } from './lib/log.js'
import commandFunctions from './command-functions.js'

export default [,
    {
        match: /([\s\S]*)/,
        usage: '任意消息',
        help: '目前只能触发AI对话上下文',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            // 如果是回复消息 且上文包含 Ollama Chat 的标识符 则继续对话
            if (msg.reply_to_message && msg.reply_to_message.text && msg.text && msg.text.indexOf('NOREPLY') == -1 && msg.reply_to_message.text.indexOf(detectOllamaChatKeyWord) != -1) {
                console.log("觸發 Ollama Chat")
                await replyOrCommandToChat(bot, msg, match)
            }
        }
    },
    {
        match: /\/(start|help)/,
        usage: '/start 或 /help',
        help: '显示帮助',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            await sendMessage(msg.chat.id, `💮满月妹妹 - v${packageMeta.version}💮\n\n指令集:\n` + (function () {
                let text = ''
                for (let i of commandFunctions) {
                    text += `/满月 ${i.usage} - ${i.help}\n`
                }
                // text += '\n参数符号解释:\n[] -> 可选\n() -> 备注\n<> -> 必填'
                return text
            })(), {
                reply_to_message_id: msg.message_id,
            })
        }
    },
    {
        match: / *\/ *(满月|滿月) ([\s\S]*)/,
        usage: '/满月 <指令> ...',
        help: '普通指令调用',
        /**
         * @param { TelegramBot } bot 
         * @param { TelegramBot.Message } msg 
         * @param { RegExpMatchArray } match 
         */
        invoke: async function (bot, msg, match) {
            commandFunctions.forEach((i) => {
                if (!i.match.test(match[2])) return
                const _match = i.match.exec(match[2])
                i.match.lastIndex = 0

                log(`运行指令 ${i.usage}`)
                i.invoke(bot, msg, _match).catch((e) => {
                    loge(`异 <${msg.chat.type}> [${msg.chat.username || msg.chat.title}(${msg.chat.id})] <- ${e}`)
                    console.error(e)
                    sendMessage(msg.chat.id, `${e}`, {
                        reply_to_message_id: msg.message_id,
                    })
                })
            })
        }
    },
]
