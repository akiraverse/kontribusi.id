import express from "express";
import {
	getAllImpactAnalyses,
	getImpactAnalysisById,
	getImpactAnalysisByOrganization,
	getMyImpactAnalysis,
	createImpactAnalysis,
	updateImpactAnalysis,
	deleteImpactAnalysis,
	calculateOrganizationImpact
} from "../controllers/impact_analysis.controller";
import { verifyToken, verifyRole } from "../middleware/authorization";
import { Role } from "@prisma/client";

const router = express.Router();

// // // Public routes
// router.get("/", getAllImpactAnalyses);
// router.get("/:id", getImpactAnalysisById);
// router.get("/organization/:organizationId", [verifyToken, verifyRole([Role.organization])], getImpactAnalysisByOrganization);

// Protected routes - Organization only
router.get("/", [verifyToken, verifyRole([Role.organization])], getMyImpactAnalysis);
router.get("/calculate", [verifyToken, verifyRole([Role.organization])], calculateOrganizationImpact);
router.post("/", [verifyToken, verifyRole([Role.organization])], createImpactAnalysis);
router.put("/:id", [verifyToken, verifyRole([Role.organization])], updateImpactAnalysis);
router.delete("/:id", [verifyToken, verifyRole([Role.organization])], deleteImpactAnalysis);

export default router;