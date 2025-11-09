import express from "express";
import { 
	getAllOpportunity, 
	getOpportunityById, 
	// getOpportunityByOrganization, 
	createOpportunity, 
	updateOpportunity, 
	deleteOpportunity } from "../controllers/volunteer_opportunity.controller";
import { verifyToken, verifyRole } from "../middleware/authorization";

import { Role } from "@prisma/client";

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/', getAllOpportunity)
app.get('/:id', getOpportunityById)
app.post('/', [verifyToken, verifyRole([Role.organization])], createOpportunity)
app.put('/:id', [verifyToken, verifyRole([Role.organization])], updateOpportunity)
app.delete('/:id', [verifyToken, verifyRole([Role.organization])], deleteOpportunity)

export default app;