/** @param {string | number} value @returns {number} */
const cents = (value) => Math.round(Number(value) * 100);
module.exports = { cents };
