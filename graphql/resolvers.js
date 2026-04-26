const Vehicle  = require('../models/vehicle');
const User     = require('../models/user');
const Question = require('../models/question');
const Answer   = require('../models/answer');
const { requireAuth } = require('../middleware/auth');

const gqlError = (message, code = 'BAD_USER_INPUT') => {
  const err = new Error(message);
  err.extensions = { code };
  throw err;
};

const resolvers = {
  Query: {
    vehicles: async (_, { filter = {} }) => {
      const { brand, model, minYear, maxYear, minPrice, maxPrice, status, page = 1, limit = 10 } = filter;

      const query = {};
      if (brand)  query.brand  = brand;
      if (model)  query.model  = model;
      if (status) query.status = status;
      if (minYear || maxYear) {
        query.year = {};
        if (minYear) query.year.$gte = minYear;
        if (maxYear) query.year.$lte = maxYear;
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        Vehicle.find(query).populate('owner', 'name email').skip(skip).limit(limit).sort({ createdAt: -1 }),
        Vehicle.countDocuments(query)
      ]);

      return { total, page, totalPages: Math.ceil(total / limit), data };
    },

    vehicle: async (_, { id }) => {
      const vehicle = await Vehicle.findById(id).populate('owner', 'name email');
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      return vehicle;
    },

    myVehicles: async (_, __, { user }) => {
      requireAuth(user);
      const data = await Vehicle.find({ owner: user.userId }).populate('owner', 'name email');
      return { total: data.length, page: 1, totalPages: 1, data };
    },

    me: async (_, __, { user }) => {
      requireAuth(user);
      return User.findById(user.userId).select('-password');
    },

    users: async (_, __, { user }) => {
      requireAuth(user);
      return User.find().select('-password');
    },

    questionsByVehicle: async (_, { vehicleId }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');

      const filter = { vehicle: vehicleId };
      const isOwner = vehicle.owner && vehicle.owner.toString() === user.userId;
      if (!isOwner) filter.user = user.userId;

      const questions = await Question.find(filter)
        .populate('user', 'name')
        .populate({ path: 'answer', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 });

      return { total: questions.length, data: questions };
    }
  },

  Mutation: {
    createVehicle: async (_, { input }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.create({ ...input, owner: user.userId });
      return Vehicle.findById(vehicle._id).populate('owner', 'name email');
    },

    updateVehicle: async (_, { id, input }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      if (vehicle.owner.toString() !== user.userId) gqlError('No autorizado', 'FORBIDDEN');
      return Vehicle.findByIdAndUpdate(id, input, { new: true, runValidators: true }).populate('owner', 'name email');
    },

    deleteVehicle: async (_, { id }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      if (vehicle.owner.toString() !== user.userId) gqlError('No autorizado', 'FORBIDDEN');
      await Vehicle.findByIdAndDelete(id);
      return true;
    },

    markVehicleAsSold: async (_, { id }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.findById(id);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      if (vehicle.owner.toString() !== user.userId) gqlError('No autorizado', 'FORBIDDEN');
      vehicle.status = vehicle.status === 'sold' ? 'available' : 'sold';
      await vehicle.save();
      return Vehicle.findById(id).populate('owner', 'name email');
    },

    createQuestion: async (_, { vehicleId, question }, { user }) => {
      requireAuth(user);
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      const existing = await Question.findOne({ vehicle: vehicleId, user: user.userId, answer: null });
      if (existing) gqlError('Ya tenés una pregunta pendiente en este vehículo');
      const newQuestion = await Question.create({ vehicle: vehicleId, user: user.userId, question });
      return Question.findById(newQuestion._id).populate('user', 'name').populate('vehicle');
    },

    createAnswer: async (_, { questionId, answer }, { user }) => {
      requireAuth(user);
      const question = await Question.findById(questionId);
      if (!question) gqlError('Pregunta no encontrada', 'NOT_FOUND');
      const vehicle = await Vehicle.findById(question.vehicle);
      if (!vehicle) gqlError('Vehículo no encontrado', 'NOT_FOUND');
      if (vehicle.owner.toString() !== user.userId) gqlError('Solo el dueño puede responder', 'FORBIDDEN');
      if (question.answer) gqlError('Esta pregunta ya fue respondida');
      const newAnswer = await Answer.create({ question: questionId, user: user.userId, answer });
      await Question.findByIdAndUpdate(questionId, { answer: newAnswer._id });
      return Answer.findById(newAnswer._id).populate('user', 'name');
    }
  },

  Vehicle: {
    questions: async (vehicle) => {
      return Question.find({ vehicle: vehicle._id })
        .populate('user', 'name')
        .populate({ path: 'answer', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 });
    }
  }
};

module.exports = resolvers;