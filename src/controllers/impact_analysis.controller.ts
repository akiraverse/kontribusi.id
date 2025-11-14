import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllImpactAnalyses = async (_req: Request, res: Response) => {
	try {
		const impactAnalyses = await prisma.impactAnalysis.findMany({
			include: {
				organization: {
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
				lastUpdated: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: impactAnalyses,
			message: `all impact analyses retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getImpactAnalysisById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const impactAnalysis = await prisma.impactAnalysis.findUnique({
			where: { id: Number(id) },
			include: {
				organization: {
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

		if (!impactAnalysis) {
			return res.status(404).json({
				status: false,
				message: "Impact analysis not found"
			});
		}

		return res.status(200).json({
			status: true,
			data: impactAnalysis,
			message: `impact analysis id ${id} retrieved`
		});

	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getImpactAnalysisByOrganization = async (req: Request, res: Response) => {
	try {
		const { organizationId } = req.params;
		
		const impactAnalyses = await prisma.impactAnalysis.findMany({
			where: { organizationId: Number(organizationId) },
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
			},
			orderBy: {
				lastUpdated: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: impactAnalyses,
			message: `impact analyses for organization ${organizationId} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getMyImpactAnalysis = async (req: Request, res: Response) => {
	try {
		const organization = await prisma.organizationProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!organization) {
			return res.status(404).json({
				status: false,
				message: "Organization profile not found"
			});
		}

		const impactAnalyses = await prisma.impactAnalysis.findMany({
			where: { organizationId: organization.id },
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
			},
			orderBy: {
				lastUpdated: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: impactAnalyses,
			message: `your organization's impact analyses retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const createImpactAnalysis = async (req: Request, res: Response) => {
	try {
		const {
			opportunity_id,
			beneficiaries,
			region_covered
		} = req.body;

		const organization = await prisma.organizationProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!organization) {
			return res.status(404).json({
				status: false,
				message: "Organization profile not found"
			});
		}

		if (!opportunity_id || !beneficiaries) {
			return res.status(400).json({
				status: false,
				message: "Opportunity ID and beneficiaries are required"
			});
		}

		// Get opportunity with accepted applications
		const opportunity = await prisma.volunteerOpportunity.findUnique({
			where: { id: Number(opportunity_id) },
			include: {
				applications: {
					where: { status: 'COMPLETED' }
				}
			}
		});

		if (!opportunity) {
			return res.status(404).json({
				status: false,
				message: "Opportunity not found"
			});
		}

		// Verify opportunity belongs to this organization
		if (opportunity.organizationId !== organization.id) {
			return res.status(403).json({
				status: false,
				message: "You are not authorized to create impact analysis for this opportunity"
			});
		}

		const findImpactAnalysis = await prisma.impactAnalysis.findFirst({
			where: {
				opportunityId: opportunity_id
			}
		})

		if (findImpactAnalysis) {
			return res.status(403).json({
			status: false,
			message: 'impact already exists'
		});
		}

		// Calculate total hours from opportunity start and end time
		const startDateTime = new Date(opportunity.startDate);
		const endDateTime = new Date(opportunity.endDate);
		const durationMilliseconds = endDateTime.getTime() - startDateTime.getTime();
		const totalHours = Math.round(durationMilliseconds / (1000 * 60 * 60));

		// Count accepted volunteers
		const totalVolunteers = opportunity.applications.length;

		const impactAnalysis = await prisma.impactAnalysis.create({
			data: {
				totalHours: totalHours,
				totalVolunteers: totalVolunteers,
				beneficiaries: parseInt(beneficiaries),
				regionCovered: region_covered || opportunity.location || null,
				organizationId: organization.id,
				opportunityId: opportunity_id
			},
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
		});

		return res.status(201).json({
			status: true,
			data: impactAnalysis,
			message: `impact analysis has been created with ${totalHours} hours and ${totalVolunteers} volunteers`
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const updateImpactAnalysis = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const {
			total_hours,
			total_volunteers,
			beneficiaries,
			region_covered
		} = req.body;

		const organization = await prisma.organizationProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!organization) {
			return res.status(404).json({
				status: false,
				message: "Organization profile not found"
			});
		}

		const impactAnalysis = await prisma.impactAnalysis.findUnique({
			where: { id: Number(id) }
		});

		if (!impactAnalysis) {
			return res.status(404).json({
				status: false,
				message: "Impact analysis not found"
			});
		}

		if (Number(organization.id) !== Number(impactAnalysis.organizationId)) {
			return res.status(403).json({
				status: false,
				message: `You are not authorized to update another organization's impact analysis`
			});
		}

		const updatedImpactAnalysis = await prisma.impactAnalysis.update({
			where: { 
				id: Number(id),
				organizationId: Number(organization.id)
			},
			data: {
				totalHours: total_hours ? parseInt(total_hours) : impactAnalysis.totalHours,
				totalVolunteers: total_volunteers ? parseInt(total_volunteers) : impactAnalysis.totalVolunteers,
				beneficiaries: beneficiaries ? parseInt(beneficiaries) : impactAnalysis.beneficiaries,
				regionCovered: region_covered !== undefined ? region_covered : impactAnalysis.regionCovered,
				lastUpdated: new Date()
			},
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
		});

		return res.status(200).json({
			status: true,
			data: updatedImpactAnalysis,
			message: `impact analysis has been updated`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const deleteImpactAnalysis = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const organization = await prisma.organizationProfile.findUnique({
			where: { userId: Number((req as any).user.id) }
		});

		if (!organization) {
			return res.status(404).json({
				status: false,
				message: "Organization profile not found"
			});
		}

		const impactAnalysis = await prisma.impactAnalysis.findUnique({
			where: { id: Number(id) }
		});

		if (!impactAnalysis) {
			return res.status(404).json({
				status: false,
				message: "Impact analysis not found"
			});
		}

		if (Number(organization.id) !== Number(impactAnalysis.organizationId)) {
			return res.status(403).json({
				status: false,
				message: `You are not authorized to delete another organization's impact analysis`
			});
		}

		const deletedImpactAnalysis = await prisma.impactAnalysis.delete({
			where: { 
				id: Number(id),
				organizationId: Number(organization.id)
			}
		});

		return res.status(200).json({
			status: true,
			data: deletedImpactAnalysis,
			message: "Impact analysis deleted successfully"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const calculateOrganizationImpact = async (req: Request, res: Response) => {
	try {
		const organization = await prisma.organizationProfile.findUnique({
			where: { userId: Number((req as any).user.id) },
			include: {
				opportunities: {
					include: {
						applications: {
							where: { status: 'COMPLETED' },
							include: {
								volunteer: {
									include: {
										portfolios: true
									}
								}
							}
						}
					}
				}
			}
		});

		if (!organization) {
			return res.status(404).json({
				status: false,
				message: "Organization profile not found"
			});
		}

		// Calculate total hours from completed applications and portfolios
		let totalHours = 0;
		let uniqueVolunteers = new Set();

		organization.opportunities.forEach(opp => {
			opp.applications.forEach(app => {
				uniqueVolunteers.add(app.volunteerId);
				// Sum hours from volunteer's portfolios related to this organization
				app.volunteer.portfolios.forEach(portfolio => {
					totalHours += portfolio.contributionHours;
				});
			});
		});

		const calculatedImpact = {
			totalHours,
			totalVolunteers: uniqueVolunteers.size,
			totalOpportunities: organization.opportunities.length,
			completedApplications: organization.opportunities.reduce(
				(sum, opp) => sum + opp.applications.length, 0
			)
		};

		return res.status(200).json({
			status: true,
			data: calculatedImpact,
			message: "Organization impact calculated"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};