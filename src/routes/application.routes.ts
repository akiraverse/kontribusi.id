import express from "express";
import { 
	getAllApplication, 
	getApplicationById, 
	// getApplicationStatistics, 
	// getApplicationsByOpportunity, 
	// getApplicationsByStatus, 
	// getApplicationsByVolunteer, 
	createApplication, 
	updateApplicationStatus, 
	deleteApplication } from "../controllers/application.controller";
import { verifyToken, verifyRole } from "../middleware/authorization";

import { Role } from "@prisma/client";

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/', getAllApplication)
app.get('/:id', getApplicationById)
app.post('/', [verifyToken, verifyRole([Role.volunteer])], createApplication)
app.put('/:id', [verifyToken, verifyRole([Role.organization])], updateApplicationStatus)
app.delete('/:id', [verifyToken, verifyRole([Role.volunteer])], deleteApplication)

export default app;