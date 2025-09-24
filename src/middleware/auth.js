require('dotenv').config();

const ADMIN_ID = parseInt(process.env.ADMIN_USER_ID);
const AUTHORIZED_USERS = [ADMIN_ID];

function isAdmin(userId) {
    return userId === ADMIN_ID;
}

function isAuthorized(userId) {
    return AUTHORIZED_USERS.includes(userId);
}

function addAuthorizedUser(userId) {
    if (!AUTHORIZED_USERS.includes(userId)) {
        AUTHORIZED_USERS.push(userId);
        return true;
    }
    return false;
}

function removeAuthorizedUser(userId) {
    const index = AUTHORIZED_USERS.indexOf(userId);
    if (index > -1) {
        AUTHORIZED_USERS.splice(index, 1);
        return true;
    }
    return false;
}

const checkAuthorization = async (ctx, next) => {
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || 'Usuario';

    if (!isAuthorized(userId)) {
        console.log(`❌ Acceso denegado: ${userName} (ID: ${userId})`);
        return await ctx.reply(`🔒 *Acceso Denegado*\n\nEste bot es privado. Tu ID es: \`${userId}\`\n\nPara solicitar acceso, contacta al administrador.`, { parse_mode: 'Markdown' });
    }

    console.log(`✅ Usuario autorizado: ${userName} (ID: ${userId})`);
    return next();
};

module.exports = {
    isAdmin,
    isAuthorized,
    addAuthorizedUser,
    removeAuthorizedUser,
    checkAuthorization,
    AUTHORIZED_USERS
};