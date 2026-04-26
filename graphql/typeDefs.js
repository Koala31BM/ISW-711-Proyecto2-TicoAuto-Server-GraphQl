const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id:              ID!
    name:            String!
    email:           String!
    cedula:          String
    first_lastname:  String
    second_lastname: String
    status:          String!
    phone:           String
    createdAt:       String
  }

  type Vehicle {
    id:          ID!
    brand:       String!
    model:       String!
    year:        Int!
    price:       Float!
    description: String
    image:       String
    status:      VehicleStatus!
    owner:       User
    questions:   [Question]
    createdAt:   String
    updatedAt:   String
  }

  type Question {
    id:        ID!
    question:  String!
    user:      User
    vehicle:   Vehicle
    answer:    Answer
    createdAt: String
  }

  type Answer {
    id:        ID!
    answer:    String!
    user:      User
    createdAt: String
  }

  enum VehicleStatus {
    available
    sold
  }

  type VehicleList {
    total:      Int!
    page:       Int!
    totalPages: Int!
    data:       [Vehicle!]!
  }

  type QuestionList {
    total: Int!
    data:  [Question!]!
  }

  input VehicleFilterInput {
    brand:    String
    model:    String
    minYear:  Int
    maxYear:  Int
    minPrice: Float
    maxPrice: Float
    status:   VehicleStatus
    page:     Int
    limit:    Int
  }

  input CreateVehicleInput {
    brand:       String!
    model:       String!
    year:        Int!
    price:       Float!
    description: String
  }

  input UpdateVehicleInput {
    brand:       String
    model:       String
    year:        Int
    price:       Float
    description: String
    status:      VehicleStatus
  }

  type Query {
    vehicles(filter: VehicleFilterInput): VehicleList!
    vehicle(id: ID!): Vehicle
    myVehicles: VehicleList!
    me: User
    users: [User!]!
    questionsByVehicle(vehicleId: ID!): QuestionList!
  }

  type Mutation {
    createVehicle(input: CreateVehicleInput!): Vehicle!
    updateVehicle(id: ID!, input: UpdateVehicleInput!): Vehicle!
    deleteVehicle(id: ID!): Boolean!
    markVehicleAsSold(id: ID!): Vehicle!
    createQuestion(vehicleId: ID!, question: String!): Question!
    createAnswer(questionId: ID!, answer: String!): Answer!
  }
`;

module.exports = typeDefs;