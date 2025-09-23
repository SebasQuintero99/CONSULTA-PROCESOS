const { Telegraf } = require('telegraf');
require('dotenv').config();

console.log('🔍 Verificando token del bot...');
console.log('Token:', process.env.BOT_TOKEN ? 'Configurado ✅' : 'No configurado ❌');

const bot = new Telegraf(process.env.BOT_TOKEN);

async function testBot() {
    try {
        console.log('🤖 Iniciando test del bot...');

        // Obtener información del bot
        const botInfo = await bot.telegram.getMe();
        console.log('✅ Bot válido:', botInfo.username);
        console.log('📱 Nombre del bot:', botInfo.first_name);

        // Configurar un comando simple
        bot.start((ctx) => {
            console.log('👤 Usuario conectado:', ctx.from.first_name);
            ctx.reply('🎉 ¡Bot funcionando correctamente!');
        });

        // Iniciar bot
        await bot.launch();
        console.log('🚀 Bot iniciado correctamente');
        console.log('📝 Listo para recibir comandos...');
        console.log('💡 Prueba enviando /start al bot');

        // Graceful stop
        process.once('SIGINT', () => {
            console.log('🛑 Deteniendo bot...');
            bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            console.log('🛑 Deteniendo bot...');
            bot.stop('SIGTERM');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el bot:', error.message);

        if (error.message.includes('401')) {
            console.error('🔑 Token inválido. Verifica que el token sea correcto.');
        } else if (error.message.includes('network')) {
            console.error('🌐 Problema de conexión a internet.');
        } else {
            console.error('🐛 Error desconocido:', error);
        }

        process.exit(1);
    }
}

testBot();