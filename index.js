import io from './lib/io.js'

const packageMeta = io.open('./package.json', 'r').readAllJsonAndClose()
import configMeta from './configMeta.js'

import { log, loge, logw } from './lib/log.js'

import TelegramBot from 'node-telegram-bot-api'
import { SocksProxyAgent } from 'socks-proxy-agent'

const token = configMeta.token
const bot = new TelegramBot(token, {
    polling: true,
    request: {
        agent: configMeta.socks_proxy ? new SocksProxyAgent(configMeta.socks_proxy) : null,
    },
})

import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'

import commandFunctions from './command-functions.js'
import globalFunctions from './global-functions.js'

bot.onText(/[\s\S]*/, (msg, match) => {
    globalFunctions.forEach((i) => {
        if (!i.match.test(msg.text)) return
        const _match = i.match.exec(msg.text)
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
})

bot.onText(/\/满月 ([\s\S]*)/, (msg, match) => {
    commandFunctions.forEach((i) => {
        if (!i.match.test(match[1])) return
        const _match = i.match.exec(match[1])
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
})

bot.onText(/\/(start|help)/, (msg, match) => {
    log(`运行帮助指令`)
    sendMessage(msg.chat.id, `💮满月妹妹 - v${packageMeta.version}💮\n\n指令集:\n` + (function() {
        let text = ''
        for (let i of commandFunctions) {
            text += `/满月 ${i.usage} - ${i.help}\n`
        }
        text += '\n参数符号解释:\n[] -> 可选\n() -> 备注\n<> -> 必填'
        return text
    })(), {
        reply_to_message_id: msg.message_id,
    })
})

MessagesQuerier.init(bot)
