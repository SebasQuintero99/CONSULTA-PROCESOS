// Gestión de sesiones de usuarios
const userSessions = {};

// Función para inicializar sesión de usuario
function initUserSession(userId) {
    if (!userSessions[userId]) {
        userSessions[userId] = {
            step: null,
            data: {}
        };
    }
    return userSessions[userId];
}

// Función para limpiar sesión
function clearUserSession(userId) {
    delete userSessions[userId];
}

// Función para obtener sesión
function getUserSession(userId) {
    return userSessions[userId];
}

module.exports = {
    initUserSession,
    clearUserSession,
    getUserSession,
    userSessions
};