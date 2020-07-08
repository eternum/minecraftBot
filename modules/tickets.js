const { randomBytes, createHash } = require('crypto');

const tickets = new Map();
function generateTicket(request) {
  const ticket = randomBytes(128).toString('hex');
  const ticketHash = getHash(ticket, 'hex');
  const expiryDate = 10000 + Date.now();
  const data = {
    ticket,
    agent: request.headers['user-agent'],
    session: request.session,
    auth: request.isAuthenticated(),
    expires: expiryDate,
  };
  tickets.set(ticketHash, data);
  setTimeout(() => {
    tickets.delete(ticketHash);
  }, 30000);
  return ticket;
}

function verifyTicket(ticket, request) {
  const ticketHash = getHash(ticket);
  if (!tickets.has(ticketHash)) return false;
  const info = tickets.get(ticketHash);
  if (!(Date.now() < info.expires)) return false;
  const ticketMatch = ticket == info.ticket;
  const userMatch = request.headers['user-agent'] == info.agent;
  const { auth } = info;
  return ticketMatch && userMatch && auth;
}
function getHash(string) {
  const hash = createHash('sha1');
  hash.update(string);
  return hash.digest('hex');
}

module.exports = {
  generateTicket,
  verifyTicket,
};
