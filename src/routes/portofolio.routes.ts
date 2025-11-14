import express from "express";
import {
	getAllPortfolios,
	getPortfolioById,
	getPortfolioByVolunteer,
	getMyPortfolios,
	createPortfolio,
	// updatePortfolio,
	// deletePortfolio,
	getPortfolioStats
} from "../controllers/portofolio.controller";
import { verifyToken, verifyRole } from "../middleware/authorization";
import { Role } from "@prisma/client";

const router = express.Router();

// Public routes
router.get("/", getAllPortfolios);
router.get("/:id", getPortfolioById);
router.get("/volunteer/:volunteerId", getPortfolioByVolunteer);

// Protected routes - Volunteer only
router.get("/", [verifyToken, verifyRole([Role.organization, Role.volunteer])], getMyPortfolios);
router.get("/stats", [verifyToken, verifyRole([Role.volunteer])], getPortfolioStats);
router.post("/", [verifyToken, verifyRole([Role.organization])], createPortfolio);
// router.put("/:id", [verifyToken, verifyRole([Role.organization])], updatePortfolio);
// router.delete("/:id", [verifyToken, verifyRole([Role.organization])], deletePortfolio);

export default router;