module.exports = {
  initQuery: _init_query,
  getHeader: _get_header
}

function _init_query(options) {
  const {to, from, subject, before, after} = options;
  let query = "";
  if (to) {
    query += `to:"${to}" `;
  }
  if (from) {
    query += `from:"${from}" `;
  }
  if (subject) {
    query += `subject:(${subject}) `;
  }
  if (after) {
    const after_epoch = Math.round(new Date(after).getTime() / 1000);
    query += `after:${after_epoch} `;
  }
  if (before) {
    const before_epoch = Math.round(new Date(before).getTime() / 1000);
    query += `before:${before_epoch} `;
  }
  query = query.trim();
  return query;
}

function _get_header(name, headers) {
  const found = headers.find(h => h.name === name);
  return found && found.value;
}