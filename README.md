# TicoAuto - Backend GraphQL

API GraphQL del marketplace TicoAuto. Maneja únicamente **consultas (lecturas)** de vehículos, usuarios y preguntas. Las escrituras se hacen contra el API REST.

Comparte la misma base de datos y el mismo `JWT_SECRET` que el API REST, por lo que el mismo token de autenticación funciona en ambos servidores.

## Tecnologías

- Node.js + Express
- Apollo Server v4
- MongoDB (Mongoose)
- JWT para autenticación

## Requisitos previos

- Node.js v18 o superior
- Acceso a la misma base de datos MongoDB que usa el API REST

## Instalación

```bash
git clone <url-del-repo>
cd ISW-711-Proyecto2-TicoAuto-Server-GraphQl
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto con:

```env
DATABASE_URL=mongodb+srv://usuario:password@cluster.mongodb.net/basedatos
JWT_SECRET=tu_secreto_jwt
GRAPHQL_PORT=4000
NODE_ENV=development
```

Importante: `DATABASE_URL` y `JWT_SECRET` deben ser **idénticos** a los del API REST para que ambos compartan datos y autenticación.

## Cómo correrlo

```bash
npm run dev
```

El servidor arranca en `http://localhost:4000/graphql`. En modo desarrollo, abre esa URL en el navegador para usar **Apollo Sandbox** y probar queries.

## Queries disponibles

- `vehicles(filter)` - Listar vehículos con filtros opcionales
- `vehicle(id)` - Obtener un vehículo por ID
- `myVehicles` - Vehículos del usuario autenticado (requiere token)
- `me` - Datos del usuario autenticado (requiere token)
- `questionsByVehicle(vehicleId)` - Preguntas de un vehículo (requiere token)

## Mutations disponibles

- `createVehicle(input)` - Crear vehículo
- `updateVehicle(id, input)` - Editar vehículo
- `deleteVehicle(id)` - Eliminar vehículo
- `createQuestion(vehicleId, question)` - Hacer pregunta
- `createAnswer(questionId, answer)` - Responder pregunta

## Autenticación

Para queries que requieren token, agregar el header:

```
Authorization: Bearer <token>
```

El token se obtiene haciendo login en el API REST (`POST /auth/token` + `POST /auth/2fa`).
