const userSessions = new Map();

function initUserSession(userId) {
    const session = {
        step: null,
        data: {}
    };
    userSessions.set(userId, session);
    return session;
}

function getUserSession(userId) {
    return userSessions.get(userId);
}

function clearUserSession(userId) {
    userSessions.delete(userId);
}

function updateUserSession(userId, updates) {
    const session = getUserSession(userId);
    if (session) {
        Object.assign(session, updates);
    }
    return session;
}

module.exports = {
    initUserSession,
    getUserSession,
    clearUserSession,
    updateUserSession
};