import express from "express"
import cors from "cors"
import path from "path"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

const app = express()
app.use(cors())

const PORT = process.env.PORT || 8000

// Swagger setup...
const swaggerOptions = {
	swaggerDefinition: {
		openapi: '2.0.0',
		info: {
			title: 'Kontribusi.id',
			version: '1.0.0',
			description: 'API documentation for Kontribusi.id'
		},
		servers: [
			{
				url: `http://localhost:${PORT}`
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT'
				}
			}
		},
		security: [{ bearerAuth: [] }]
	},
	apis: ['./src/routers/*.ts'],
}

const swaggerDocs = swaggerJSDoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

// app.get('')

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
	console.log(`listening at http://localhost:${PORT}`)
})