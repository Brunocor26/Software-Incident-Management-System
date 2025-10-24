const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id:  { type: Number, required: true },
    name: { type: String, required: true },
    papel: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});


// Método para comparar senha
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
