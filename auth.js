// Lista de usuarios autorizados (IDs de Telegram)
const AUTHORIZED_USERS = [
    1913689146, // Tu ID (Sebastián Quintero)
    // Agrega aquí más IDs de usuarios autorizados
    // 123456789,  // Ejemplo: ID de otro usuario
];

// Lista de administradores (pueden agregar usuarios)
const ADMIN_USERS = [
    1913689146, // Tu ID como administrador
];

// Middleware para verificar autorización
function checkAuthorization(ctx, next) {
    const userId = ctx.from.id;

    // Permitir el comando /mi_id para cualquier usuario
    if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/mi_id')) {
        console.log(`🆔 Comando /mi_id permitido para: ${ctx.from.first_name} (ID: ${userId})`);
        return next();
    }

    if (!AUTHORIZED_USERS.includes(userId)) {
        console.log(`❌ Usuario no autorizado intentó acceder: ${ctx.from.first_name} (ID: ${userId})`);
        return ctx.reply('🔒 *Acceso Denegado*\n\nEste bot es privado.\n\n💡 Para obtener tu ID y solicitar acceso, envía: `/mi_id`',
            { parse_mode: 'Markdown' });
    }

    console.log(`✅ Usuario autorizado: ${ctx.from.first_name} (ID: ${userId})`);
    return next();
}

// Función para verificar si es administrador
function isAdmin(userId) {
    return ADMIN_USERS.includes(userId);
}

// Función para agregar usuario autorizado (solo admins)
function addAuthorizedUser(userId) {
    if (!AUTHORIZED_USERS.includes(userId)) {
        AUTHORIZED_USERS.push(userId);
        return true;
    }
    return false;
}

// Función para remover usuario autorizado (solo admins)
function removeAuthorizedUser(userId) {
    const index = AUTHORIZED_USERS.indexOf(userId);
    if (index > -1) {
        AUTHORIZED_USERS.splice(index, 1);
        return true;
    }
    return false;
}

module.exports = {
    checkAuthorization,
    isAdmin,
    addAuthorizedUser,
    removeAuthorizedUser,
    AUTHORIZED_USERS
};