import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    action:{
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
        type: String,
        required: true
    }
})

const log = mongoose.model('log', logSchema)

export default log;