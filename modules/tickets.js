const { randomBytes, createHash } = require("crypto");

var tickets = new Map();
function generateTicket(request) {
  let ticket = randomBytes(128).toString("hex");
  let ticketHash = getHash(ticket, "hex");
  let expiryDate = 10000 + Date.now();
  let data = {
    ticket: ticket,
    agent: request.headers["user-agent"],
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
  let ticketHash = getHash(ticket);
  if (!tickets.has(ticketHash)) return false;
  let info = tickets.get(ticketHash);
  if (!(Date.now() < info.expires)) return false;
  let ticketMatch = ticket == info.ticket;
  let userMatch = request.headers["user-agent"] == info.agent;
  let auth = info.auth;
  return ticketMatch && userMatch && auth;
}
function getHash(string) {
  let hash = createHash("sha1");
  hash.update(string);
  return hash.digest("hex");
}

module.exports = {
  generateTicket,
  verifyTicket,
};
