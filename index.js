import configMeta from './configMeta.js'

import TelegramBot from 'node-telegram-bot-api'
import { SocksProxyAgent } from 'socks-proxy-agent'

const token = configMeta.token
const bot = new TelegramBot(token, {
    polling: true,
    request: {
        agent: configMeta.socks_proxy ? new SocksProxyAgent(configMeta.socks_proxy) : null,
    },
})

import { MessagesQuerier } from './MessagesQuerier.js'

MessagesQuerier.init(bot)
