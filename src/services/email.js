//node mailer
const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailconfig');

const transport = nodemailer.createTransport(emailConfig);

// Expose a verify helper without changing the export shape.
transport.verifyTransport = async () => transport.verify();

module.exports = transport;