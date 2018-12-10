const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let maintainSchema = new Schema ({
  status: { type: Boolean }
}, { versionKey: false });


let maintain_schema = mongoose.model('Maintain', maintainSchema);

module.exports = maintain_schema;