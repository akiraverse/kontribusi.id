import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllPortfolios = async (_req: Request, res: Response) => {
	try {
		const portfolios = await prisma.portfolio.findMany({
			include: {
				volunteer: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: portfolios,
			message: `all portfolios retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getPortfolioById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const portfolio = await prisma.portfolio.findUnique({
			where: { id: Number(id) },
			include: {
				volunteer: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true
							}
						}
					}
				}
			}
		});

		if (!portfolio) {
			return res.status(404).json({
				status: false,
				message: "Portfolio not found"
			});
		}

		return res.status(200).json({
			status: true,
			data: portfolio,
			message: `portfolio id ${id} retrieved`
		});

	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getPortfolioByVolunteer = async (req: Request, res: Response) => {
	try {
		const { volunteerId } = req.params;
		
		const portfolios = await prisma.portfolio.findMany({
			where: { volunteerId: Number(volunteerId) },
			include: {
				volunteer: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: portfolios,
			message: `portfolios for volunteer ${volunteerId} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getMyPortfolios = async (req: Request, res: Response) => {
	try {
		const volunteer = await prisma.volunteerProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!volunteer) {
			return res.status(404).json({
				status: false,
				message: "Volunteer profile not found"
			});
		}

		const portfolios = await prisma.portfolio.findMany({
			where: { volunteerId: volunteer.id },
			include: {
				volunteer: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: portfolios,
			message: `your portfolios retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const createPortfolio = async (req: Request, res: Response) => {
	try {
		const {
			application_id,
			certificate,
			badge,
			feedback
		} = req.body;

		if (!application_id) {
			return res.status(400).json({
				status: false,
				message: "Application ID is required"
			});
		}

		// Check if application exists and belongs to this volunteer
		const application = await prisma.application.findUnique({
			where: { id: Number(application_id) },
			include: {
				opportunity: {
					include: {
						availableTimes: true
					}
				},
				volunteer: true
			}
		});

		if (!application) {
			return res.status(404).json({
				status: false,
				message: "Application not found"
			});
		}


		// Check if application is completed
		if (application.status !== 'COMPLETED') {
			return res.status(400).json({
				status: false,
				message: `Cannot create portfolio. Application status must be COMPLETED (current status: ${application.status})`
			});
		}

		// Check if portfolio already exists for this application
		const existingPortfolio = await prisma.portfolio.findUnique({
			where: {
				volunteerId: Number(application.volunteerId)
			}
		});

		if (existingPortfolio) {
			return res.status(400).json({
				status: false,
				message: "Portfolio already exists for this activity"
			});
		}

		// Calculate contribution hours from opportunity's start and end date/time
		const startDateTime = new Date(application.opportunity.startDate);
		const endDateTime = new Date(application.opportunity.endDate);
		
		// Calculate total hours between start and end datetime
		const durationMilliseconds = endDateTime.getTime() - startDateTime.getTime();
		const totalHours = durationMilliseconds / (1000 * 60 * 60); // Convert ms to hours

		const portfolio = await prisma.portfolio.create({
			data: {
				activityTitle: application.opportunity.title,
				contributionHours: Math.round(totalHours),
				certificate: certificate || null,
				badge: badge || null,
				feedback: feedback || null,
				volunteerId: application.volunteerId

			},
			include: {
				volunteer: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true
							}
						}
					}
				}
			}
		});

		return res.status(201).json({
			status: true,
			data: portfolio,
			message: `portfolio has been created with ${Math.round(totalHours)} contribution hours`
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

// export const updatePortfolio = async (req: Request, res: Response) => {
// 	try {
// 		const { id } = req.params;
// 		const {
// 			activity_title,
// 			contribution_hours,
// 			certificate,
// 			badge,
// 			feedback
// 		} = req.body;

// 		const portfolio = await prisma.portfolio.findUnique({
// 			where: { id: Number(id) }
// 		});

// 		if (!portfolio) {
// 			return res.status(404).json({
// 				status: false,
// 				message: "Portfolio not found"
// 			});
// 		}

// 		const updatedPortfolio = await prisma.portfolio.update({
// 			where: { 
// 				id: Number(id),
// 			},
// 			data: {
// 				activityTitle: activity_title || portfolio.activityTitle,
// 				contributionHours: contribution_hours ? parseInt(contribution_hours) : portfolio.contributionHours,
// 				certificate: certificate !== undefined ? certificate : portfolio.certificate,
// 				badge: badge !== undefined ? badge : portfolio.badge,
// 				feedback: feedback !== undefined ? feedback : portfolio.feedback
// 			},
// 			include: {
// 				volunteer: {
// 					include: {
// 						user: {
// 							select: {
// 								id: true,
// 								name: true,
// 								email: true
// 							}
// 						}
// 					}
// 				}
// 			}
// 		});

// 		return res.status(200).json({
// 			status: true,
// 			data: updatedPortfolio,
// 			message: `portfolio has been updated`
// 		});
// 	} catch (error) {
// 		return res.status(400).json({
// 			status: false,
// 			message: `error: ${error}`
// 		});
// 	}
// };

// export const deletePortfolio = async (req: Request, res: Response) => {
// 	try {
// 		const { id } = req.params;

// 		const volunteer = await prisma.volunteerProfile.findUnique({
// 			where: { userId: Number((req as any).user.id) }
// 		});

// 		if (!volunteer) {
// 			return res.status(404).json({
// 				status: false,
// 				message: "Volunteer profile not found"
// 			});
// 		}

// 		const portfolio = await prisma.portfolio.findUnique({
// 			where: { id: Number(id) }
// 		});

// 		if (!portfolio) {
// 			return res.status(404).json({
// 				status: false,
// 				message: "Portfolio not found"
// 			});
// 		}

// 		const deletedPortfolio = await prisma.portfolio.delete({
// 			where: { 
// 				id: Number(id)
// 			}
// 		});

// 		return res.status(200).json({
// 			status: true,
// 			data: deletedPortfolio,
// 			message: "Portfolio deleted successfully"
// 		});
// 	} catch (error) {
// 		return res.status(400).json({
// 			status: false,
// 			message: `error: ${error}`
// 		});
// 	}
// };

export const getPortfolioStats = async (req: Request, res: Response) => {
	try {
		const volunteer = await prisma.volunteerProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!volunteer) {
			return res.status(404).json({
				status: false,
				message: "Volunteer profile not found"
			});
		}

		const portfolios = await prisma.portfolio.findMany({
			where: { volunteerId: volunteer.id }
		});

		const totalHours = portfolios.reduce((sum, p) => sum + p.contributionHours, 0);
		const totalActivities = portfolios.length;
		const certificatesCount = portfolios.filter(p => p.certificate).length;
		const badgesCount = portfolios.filter(p => p.badge).length;

		return res.status(200).json({
			status: true,
			data: {
				totalHours,
				totalActivities,
				certificatesCount,
				badgesCount,
				portfolios
			},
			message: "Portfolio statistics retrieved"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};