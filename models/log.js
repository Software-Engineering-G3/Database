import mongoose from 'mongoose';

await mongoose.connect('mongodb+srv://hpmanen0:lolxd@seproject-group3.fdnfesb.mongodb.net/?retryWrites=true&w=majority');
mongoose.set('strictQuery', true);

const logSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        default: Date.now,
        required: true
    }
})

const log = mongoose.model('log', logSchema)

export default log;