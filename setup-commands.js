const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

async function setupBotCommands() {
    try {
        console.log('⚙️ Configurando comandos del bot...');

        // Definir los comandos que aparecerán en el menú
        const commands = [
            {
                command: 'start',
                description: '🏛️ Menú principal del bot'
            },
            {
                command: 'registrar_abogado',
                description: '📝 Registrar nuevo abogado'
            },
            {
                command: 'registrar_plataforma',
                description: '🏢 Registrar nueva plataforma'
            },
            {
                command: 'registrar_proceso',
                description: '⚖️ Registrar nuevo proceso'
            },
            {
                command: 'listar_abogados',
                description: '👥 Ver abogados registrados'
            },
            {
                command: 'listar_plataformas',
                description: '🔗 Ver plataformas registradas'
            },
            {
                command: 'listar_procesos',
                description: '📋 Ver procesos registrados'
            }
        ];

        // Establecer los comandos en Telegram
        await bot.telegram.setMyCommands(commands);

        console.log('✅ Comandos configurados exitosamente:');
        commands.forEach(cmd => {
            console.log(`   /${cmd.command} - ${cmd.description}`);
        });

        console.log('\n💡 Ahora cuando los usuarios escriban "/" verán estos comandos disponibles');

    } catch (error) {
        console.error('❌ Error al configurar comandos:', error);
    }
}

// Ejecutar configuración
setupBotCommands();