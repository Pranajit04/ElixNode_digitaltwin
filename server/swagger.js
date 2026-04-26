const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ElixNode API',
      version: '1.0.0',
      description: 'Digital Twin Sensor Monitoring API',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development',
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(options);

// Verify spec is generated properly
if (!swaggerSpec || !swaggerSpec.info) {
  console.warn('⚠️  Warning: Swagger spec may not be generated correctly');
}

module.exports = swaggerSpec;
