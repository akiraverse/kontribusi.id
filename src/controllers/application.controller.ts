import { PrismaClient, ApplicationStatus } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllApplication = async (req: Request, res: Response) => {
	try {
		const applications = await prisma.application.findMany({
			include: {
				volunteer: {
					include: {
					user: true
					}
				},
				opportunity: {
					include: {
					organization: true
					}
				}
			},
				orderBy: {
				applyDate: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: applications,
			message: `all applications retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getApplicationById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const application = await prisma.application.findUnique({
			where: { id },
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
			},
			opportunity: {
				include: {
				organization: {
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
			}
			}
		});

		if (!application) {
			return res.status(404).json({
			status: false,
			message: "Application not found"
			});
		}

		return res.status(200).json({
			status: true,
			data: application,
			message: `application id ${id} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getApplicationsByVolunteer = async (req: Request, res: Response) => {
	try {
		const { volunteerId } = req.params;

		const applications = await prisma.application.findMany({
			where: { volunteerId },
			include: {
			opportunity: {
				include: {
				organization: {
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
			}
			},
			orderBy: {
			applyDate: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: applications,
			message: `applications for volunteer ${volunteerId} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getApplicationsByOpportunity = async (req: Request, res: Response) => {
	try {
		const { opportunityId } = req.params;

		const applications = await prisma.application.findMany({
			where: { opportunityId },
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
			applyDate: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: applications,
			message: `applications for opportunity ${opportunityId} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getApplicationsByStatus = async (req: Request, res: Response) => {
	try {
		const { status } = req.params;

		// Validate status
		if (!Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
			return res.status(400).json({
			status: false,
			message: "Invalid status. Must be PENDING, ACCEPTED, REJECTED, or COMPLETED"
			});
		}

		const applications = await prisma.application.findMany({
			where: { status: status as ApplicationStatus },
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
			},
			opportunity: {
				include: {
				organization: true
				}
			}
			},
			orderBy: {
			applyDate: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: applications,
			message: `${status} applications retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const createApplication = async (req: Request, res: Response) => {
	try {
		const {
			volunteer_id,
			opportunity_id
		} = req.body;

		// Validate required fields
		if (!volunteer_id || !opportunity_id) {
			return res.status(400).json({
			status: false,
			message: "Missing required fields: volunteer_id, opportunity_id"
			});
		}

		// Check if volunteer exists
		const volunteer = await prisma.volunteerProfile.findUnique({
			where: { id: volunteer_id }
		});

		if (!volunteer) {
			return res.status(404).json({
			status: false,
			message: "Volunteer profile not found"
			});
		}

		// Check if opportunity exists
		const opportunity = await prisma.volunteerOpportunity.findUnique({
			where: { id: opportunity_id },
			include: {
			applications: {
				where: {
				status: {
				in: [ApplicationStatus.ACCEPTED, ApplicationStatus.PENDING]
				}
				}
			}
			}
		});

		if (!opportunity) {
			return res.status(404).json({
			status: false,
			message: "Opportunity not found"
			});
		}

		// Check if already applied
		const existingApplication = await prisma.application.findFirst({
			where: {
			volunteerId: volunteer_id,
			opportunityId: opportunity_id
			}
		});

		if (existingApplication) {
			return res.status(400).json({
			status: false,
			message: "You have already applied to this opportunity"
			});
		}

		// Check if opportunity is full
		const acceptedCount = opportunity.applications.filter(
			app => app.status === ApplicationStatus.ACCEPTED
		).length;

		if (acceptedCount >= opportunity.capacity) {
			return res.status(400).json({
			status: false,
			message: "This opportunity has reached its capacity"
			});
		}

		// Check if opportunity date has passed
		if (new Date() > opportunity.endDate) {
			return res.status(400).json({
			status: false,
			message: "This opportunity has already ended"
			});
		}

		// Create application
		const application = await prisma.application.create({
			data: {
			volunteerId: volunteer_id,
			opportunityId: opportunity_id,
			status: ApplicationStatus.PENDING
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
			},
			opportunity: {
				include: {
				organization: {
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
			}
			}
		});

		return res.status(201).json({
			status: true,
			data: application,
			message: `application has been created`
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const updateApplicationStatus = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		// Validate status
		if (!status || !Object.values(ApplicationStatus).includes(status as ApplicationStatus)) {
			return res.status(400).json({
			status: false,
			message: "Invalid status. Must be PENDING, ACCEPTED, REJECTED, or COMPLETED"
			});
		}

		// Check if application exists
		const application = await prisma.application.findUnique({
			where: { id },
			include: {
			opportunity: {
				include: {
				applications: {
				where: {
					status: ApplicationStatus.ACCEPTED
				}
				}
				}
			}
			}
		});

		if (!application) {
			return res.status(404).json({
			status: false,
			message: "Application not found"
			});
		}
		if (status === ApplicationStatus.ACCEPTED) {
			const acceptedCount = application.opportunity.applications.length;
			
			if (acceptedCount >= application.opportunity.capacity) {
			return res.status(400).json({
				status: false,
				message: "Cannot accept application. Opportunity has reached its capacity"
			});
			}
		}

		const updatedApplication = await prisma.application.update({
			where: { id },
			data: { status: status as ApplicationStatus },
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
				},
				opportunity: {
					include: {
						organization: true
					}
				}
			}
		});

		return res.status(200).json({
			status: true,
			data: updatedApplication,
			message: `application status has been updated to ${status}`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const deleteApplication = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const application = await prisma.application.findUnique({
			where: { id }
		});

		if (!application) {
			return res.status(404).json({
			status: false,
			message: "Application not found"
			});
		}

		// Only allow deletion if status is PENDING or REJECTED
		if (application.status === ApplicationStatus.ACCEPTED || application.status === ApplicationStatus.COMPLETED) {
			return res.status(400).json({
			status: false,
			message: "Cannot delete accepted or completed applications"
			});
		}

		// Delete application
		const deletedApplication = await prisma.application.delete({
			where: { id }
		});

		return res.status(200).json({
			status: true,
			data: deletedApplication,
			message: "Application deleted successfully"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getApplicationStatistics = async (req: Request, res: Response) => {
	try {
		const { volunteerId } = req.params;

		const stats = await prisma.application.groupBy({
			by: ['status'],
			where: volunteerId ? { volunteerId } : {},
			_count: {
			status: true
			}
		});

		const statistics = {
			total: stats.reduce((sum, stat) => sum + stat._count.status, 0),
			pending: stats.find(s => s.status === ApplicationStatus.PENDING)?._count.status || 0,
			accepted: stats.find(s => s.status === ApplicationStatus.ACCEPTED)?._count.status || 0,
			rejected: stats.find(s => s.status === ApplicationStatus.REJECTED)?._count.status || 0,
			completed: stats.find(s => s.status === ApplicationStatus.COMPLETED)?._count.status || 0
		};

		return res.status(200).json({
			status: true,
			data: statistics,
			message: "Application statistics retrieved"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};