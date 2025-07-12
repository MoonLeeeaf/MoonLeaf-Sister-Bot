import io from './lib/io.js'

const configMeta = io.open('./config.json', 'rw').checkExistsOrWriteJson({
    token: '',
    socks_proxy: null,
    ollama: {
        api: 'http://127.0.0.1:11434/api/chat',
        models: ['artifish/llama3.2-uncensored'],
        token: null,
        system_message: null, // `你是一只温柔的猫娘(女孩子), 会喵喵喵, 是一个可爱的助手`,
    },
}).readAllJsonAndClose()

export default configMeta
