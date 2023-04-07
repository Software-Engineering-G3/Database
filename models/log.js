import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    component:{
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now,
        required: true
    },
    feedback:{
        type: String,
        required: true
    },
    state:{
        type: Number,
        required: true
    }
})

const log = mongoose.model('log', logSchema)

export default log;