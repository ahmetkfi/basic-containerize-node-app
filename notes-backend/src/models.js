const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NoteSchema = new Schema({
    title:{ type: String, required: true },
    content: { type: String, required: false },
    notebookId: { type: mongoose.Schema.Types.ObjectId,required: false, default: null },
},
{ timestamps: true }
);

const Note = mongoose.model('Notebook', NoteSchema);

module.exports = { Note };


