import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema({
    component:{
        type: String,
        required: true
    },
    state:{
        type: String,
        required: true
    }
})

const status = mongoose.model('status', statusSchema)

export default status;