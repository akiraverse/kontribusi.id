import express from "express"
import cors from "cors"
import path from "path"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

import userRoute from "../src/routes/user.routes"
import opportunityRoute from "../src/routes/volunteer_opportunity.routes"
// import portofolioRoute from "../src/routes/portofolio.routes"
import applicationRoute from "../src/routes/application.routes"
// import impactRoute from "../src/routes/portofolio.routes"


const app = express()
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000

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

app.use('/user', userRoute)
app.use('/opportunity', opportunityRoute)
app.use('/application', applicationRoute)

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
	console.log(`listening at http://localhost:${PORT}`)
})