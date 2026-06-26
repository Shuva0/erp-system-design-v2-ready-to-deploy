const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // select:false = never returned by default
    googleId: { type: String, default: null },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified (avoids re-hashing on every save)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare login password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
