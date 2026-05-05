const crypto = require("crypto");

function generateSession(context, events, done) {
  const id = crypto.randomUUID();

  context.vars.installationId = `load_device_${id}`;
  context.vars.appSessionId = `load_session_${id}`;

  return done();
}

module.exports = {
  generateSession,
};