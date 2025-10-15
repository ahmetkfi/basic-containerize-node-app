const express = require('express');
const noteRouter= express.Router();
const axios = require('axios');
const {Note} = require('./models.js');
const { default: mongoose, mongo } = require('mongoose');
const notebooksApiUrl= process.env.NOTEBOOKS_API_URL 

const validateId = (req,res,next) => {
    const id = req.params.id;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({error: "Invalid ID"});
    }
    next();
};

noteRouter.use('/:id', validateId);



// Create new notebooks : POST "/"
noteRouter.post('/', async (req, res) => {
    try{
        const {title,content,notebookId} = req.body;
        let validatedNotebookId = null;
        
        if(!notebookId){
            console.info({
                message: "No notebookId provided, creating note without association"
            });
        }else if(!mongoose.Types.ObjectId.isValid(notebookId)){
            return res.status(400).json({error: "Invalid notebookId"});
        }else{
        try{
            await axios.get(`${notebooksApiUrl}/${notebookId}`);
            validatedNotebookId = notebookId;

        }catch(err){
            const jsonError = err.toJSON();
            if(jsonError.status === 404){
                return res.status(400).json({error: "Notebook does not exist"});
            }else{
                console.error({
                    message: "Error validating notebookId",
                    notebookId,
                    error: err.message
                });
            }
            
        }finally{
            validateId=notebookId;
        }
        }
        if(!title || !content){
            return res.status(400).json({error: "Title and Content are required"});
        }
        const note = new Note({title,content, notebookId: validatedNotebookId});
        await note.save();
        res.status(201).json({data: note});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
    
});
// Retrieve all notebooks : GET "/"
noteRouter.get('/', async (req, res) => {
    try{
        const notes = await Note.find();
        res.status(200).json({data: notes});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});

// Get a notebook : GET "/:id" - localhost:8080/api/notebooks/12345
noteRouter.get('/:id', validateId,async (req, res) => {
    try{
        const note = await Note.findById(req.params.id);
        if(!note){
            return res.status(404).json({error: "Note not found"});
        }
        res.status(200).json({data: note});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});
// Create new notebooks : PUT "/:id" - localhost:8080/api/notebooks/12345
noteRouter.put('/:id',validateId, async (req, res) => {
    try{
        const {title,content} = req.body;
        if(!title || !content){
            return res.status(400).json({error: "Title and Content are required"});
        }
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            {title,content},
            {new: true}
        );
        if(!note){
            return res.status(404).json({error: "Note not found"});
        }
        res.status(200).json({data: note});
       
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});
// Delete a notebook : DELETE "/:id" - localhost:8080/api/notebooks/12345
noteRouter.delete('/:id', validateId,async (req, res) => {
    try{
        const note = await Note.findByIdAndDelete(req.params.id);
        if(!note){
            return res.status(404).json({error: "Note not found"});
        }
        res.status(200).json({data: "Note deleted successfully"});
    }catch(error){
        res.status(500).json({ error: error.message });
    }
});





module.exports = noteRouter