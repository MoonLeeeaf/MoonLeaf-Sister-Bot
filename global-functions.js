import TelegramBot from "node-telegram-bot-api"
import fetchAsBuffer from "./lib/fetchAsBuffer.js"
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'
import { requestChat, chatResultToText, replyOrCommandToChat, detectOllamaChatKeyWord } from './ollama-chat.js'

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
            if (msg.reply_to_message && msg.reply_to_message.text && msg.reply_to_message.text.indexOf(detectOllamaChatKeyWord) != -1)
                await replyOrCommandToChat(bot, msg, match)
        }
    },
]
