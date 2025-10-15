const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const notebookRouter = require('./route');




const PORT = process.env.PORT ;
 
const app = express();

app.use(bodyParser.json());
app.use('/api/notebooks', notebookRouter);

mongoose.connect(process.env.DB_URL)
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {
  console.log(`Notesbook Server is running on port ${PORT}`);
});
})
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});
