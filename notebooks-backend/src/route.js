const express = require('express');
const notebookRouter= express.Router();
const {Notebook} = require('./models.js');
const { default: mongoose } = require('mongoose');

const validateId = (req,res,next) => {
    const id = req.params.id;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({error: "Invalid ID"});
    }
    next();
};

notebookRouter.use('/:id', validateId);



// Create new notebooks : POST "/"
notebookRouter.post('/', async (req, res) => {
    try{
        const {name,description} = req.body;
        if(!name){
            return res.status(400).json({error: "Name is required"});
        }
        const notebook = new Notebook({name,description});
        await notebook.save();
        res.status(201).json({data: notebook});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
    
});
// Retrieve all notebooks : GET "/"
notebookRouter.get('/', async (req, res) => {
    try{
        const notebooks = await Notebook.find();
        res.status(200).json({data: notebooks});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});

// Get a notebook : GET "/:id" - localhost:8080/api/notebooks/12345
notebookRouter.get('/:id', validateId,async (req, res) => {
    try{
        const notebook = await Notebook.findById(req.params.id);
        if(!notebook){
            return res.status(404).json({error: "Notebook not found"});
        }
        res.status(200).json({data: notebook});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});
// Create new notebooks : PUT "/:id" - localhost:8080/api/notebooks/12345
notebookRouter.put('/:id',validateId, async (req, res) => {
    try{
        const {name,description} = req.body;
        if(!name){
            return res.status(400).json({error: "Name is required"});
        }
        const notebook = await Notebook.findByIdAndUpdate(
            req.params.id,
            {name,description},
            {new: true}
        );
        if(!notebook){
            return res.status(404).json({error: "Notebook not found"});
        }
        res.status(200).json({data: notebook});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});
// Delete a notebook : DELETE "/:id" - localhost:8080/api/notebooks/12345
notebookRouter.delete('/:id', validateId,async (req, res) => {
    try{
        const notebook = await Notebook.findByIdAndDelete(req.params.id);
        if(!notebook){
            return res.status(404).json({error: "Notebook not found"});
        }
        res.status(200).json({data: "Notebook deleted successfully"});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});





module.exports = notebookRouter;