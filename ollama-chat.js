import TelegramBot from 'node-telegram-bot-api'
import configMeta from './configMeta.js'
import getImageBase64 from './lib/getImageBase64.js'
import { MessagesQuerier, sendMessage, sendPhoto, sendVoice } from './MessagesQuerier.js'

const model = configMeta.ollama.model
async function requestChat(messages) {
    configMeta.ollama.system_message && messages.unshift({
        role: 'system',
        content: configMeta.ollama.system_message,
    })
    const re = await fetch(configMeta.ollama.api/*`${configMeta.ollama.baseUrl}/api/chat`*/, {
        method: 'POST',
        body: JSON.stringify({
            model: model,
            messages: messages,
            // 不使用流式传输
            stream: false,
            opinions: {
                /*
                 * 对于 DeekSeek 来说:
                 * 代码生成/数学解题 0.0
                 * 数据抽取/分析 1.0
                 * 通用对话 1.3
                 * 翻译 1.3
                 * 创意类写作/诗歌创作 1.5
                 */
                temperature: 1.3,
            }
        }),
        headers: {
            "Content-Type": 'application/json',
            Authorization: configMeta.ollama.token ? ('Bearer ' + configMeta.ollama.token) : '',
        }
    })
    const json = await re.json()
    if (!re.ok) throw new Error(JSON.stringify(json))
    return json
}

const detectOllamaChatKeyWord = '[Ollama Chat]'
function chatResultToText(o) {
    console.log('Ollama Result: ' + JSON.stringify(o))
    const thinkRegExp = /<think>([\s\S]*)<\/think>/
    const msg = (o.message || o.choices[0].message).content
    let think = thinkRegExp.test(msg) ? thinkRegExp.exec(msg)[1].trim() : ''
    let content = msg.replace(/<think>[\s\S]*<\/think>/, '').trim()
    return `<blockquote expandable>${detectOllamaChatKeyWord}\n模型: ${model}\n${ o.usage ? `Token消耗: 共 ${o.usage.total_tokens} 个\n` : '' }${ o.eval_duration ? `已${ think == '' ? '' :'深度' }思考 ${Math.round(o.eval_duration / 1e9 * 100) / 100}s\n` : '' }${ think == '' ? '(压根没过程)思考过程如下' : `思考过程如下\n\n${think}` }<\/blockquote>${content}`
}

/**
 * @param { TelegramBot } bot 
 * @param { TelegramBot.Message } msg 
 * @param { RegExpExecArray } match 
 */
async function replyOrCommandToChat(bot, msg, match) {
    /**
     * @param { TelegramBot.MessageId } msgId 
     * @returns { TelegramBot.Message }
     */
    function queryMessage(msgId) {
        return MessagesQuerier.query(msg.chat.id, msgId)
    }
    
    // 初次对话 只有这里需要使用 match 参数
    if (msg.reply_to_message == null) {
        await sendMessage(msg.chat.id, chatResultToText(await requestChat([{
            role: 'user',
            content: match[1],
            images: msg.photo ? [
                await getImageBase64(await bot.getFileStream(msg.photo[msg.photo.length - 1].file_id)),
            ] : [],
        }])), {
            reply_to_message_id: msg.message_id,
            parse_mode: 'HTML',
        })
    } else {
        // 一个个回复寻找 拼凑聊天记录
        // 使用 unshift 以反向添加到列表
        let messages = []
        /** @type { TelegramBot.Message } */
        let parent_msg = msg
    
        // 先获取 Bot 的ID
        const myId = (await bot.getMe()).id
    
        const user_reply_with_command_regexp = /\/满月 chat ([\s\S]*)/
        do {
            // Bot 的回复
            if (parent_msg.from.id == myId)
                messages.unshift({
                    role: 'assistant',
                    // 剔除无用的数据
                    content: (/[\s\S]*思考过程如下([\s\S]*)/).exec(parent_msg.text)[1].trim(),
                    images: parent_msg.photo ? [
                        await getImageBase64(await bot.getFileStream(parent_msg.photo[parent_msg.photo.length - 1].file_id)),
                    ] : [],
                })
            else
                messages.unshift({
                    role: 'user',
                    // 可以使用指令 或者直接回复
                    content: user_reply_with_command_regexp.test(parent_msg.text) ? user_reply_with_command_regexp.exec(parent_msg.text)[1] : parent_msg.text.substring(1),
                    images: parent_msg.photo ? [
                        await getImageBase64(await bot.getFileStream(parent_msg.photo[parent_msg.photo.length - 1].file_id)),
                    ] : [],
                })
    
            // 当没有上文时 退出循环
            if (parent_msg.reply_to_message == null)
                break
            
            // 获取上文
            parent_msg = queryMessage(parent_msg.reply_to_message.message_id)
        } while (parent_msg != null)

        await sendMessage(msg.chat.id, chatResultToText(await requestChat(messages)), {
            reply_to_message_id: msg.message_id,
            parse_mode: 'HTML',
        })
    }
}

export {
    requestChat,
    chatResultToText,
    replyOrCommandToChat,
    detectOllamaChatKeyWord,
}