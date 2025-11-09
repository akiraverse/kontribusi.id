import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllOpportunity = async (_req: Request, res: Response) => {
	try {
		const opportunities = await prisma.volunteerOpportunity.findMany({
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
			},
			applications: {
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
			}
			},
				orderBy: {
				createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: opportunities,
			message: `all opportunities retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getOpportunityById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const opportunity = await prisma.volunteerOpportunity.findUnique({
			where: { id },
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
			},
			applications: {
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
			}
			}
		});

	if (!opportunity) {
		return res.status(404).json({
			status: false,
			message: "Opportunity not found"
		});
	}

	return res.status(200).json({
		status: true,
		data: opportunity,
		message: `opportunity id ${id} retrieved`
	});

	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getOpportunityByOrganization = async (req: Request, res: Response) => {
	try {
		const { organizationId } = req.params;
		
		const opportunities = await prisma.volunteerOpportunity.findMany({
			where: { organizationId },
			include: {
				organization: true,
				applications: {
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
				}
			},
			orderBy: {
			createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: opportunities,
			message: `opportunities for organization ${organizationId} retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const createOpportunity = async (req: Request, res: Response) => {
	try {
		const {
			title,
			description,
			location,
			start_date,
			end_date,
			category,
			capacity,
			required_skills,
			organization_id
		} = req.body;

		if (!title || !start_date || !end_date || !capacity || !organization_id) {
			return res.status(400).json({
			status: false,
			message: "Missing required fields: title, start_date, end_date, capacity, organization_id"
			});
		}

		const organization = await prisma.organizationProfile.findUnique({
			where: { id: organization_id }
		});

		if (!organization) {
			return res.status(404).json({
			status: false,
			message: "Organization not found"
			});
		}

		const startDate = new Date(start_date);
		const endDate = new Date(end_date);

		if (startDate >= endDate) {
			return res.status(400).json({
			status: false,
			message: "End date must be after start date"
			});
		}

		const opportunity = await prisma.volunteerOpportunity.create({
			data: {
				title,
				description: description || null,
				location: location || null,
				startDate,
				endDate,
				category: category || null,
				capacity: parseInt(capacity),
				requiredSkills: required_skills || [],
				organizationId: organization_id
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
			data: opportunity,
			message: `an opportunity has been created`
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const updateOpportunity = async (req: Request, res: Response) => {
  	try {
		const { id } = req.params;
		const {
			title,
			description,
			location,
			start_date,
			end_date,
			category,
			capacity,
			required_skills,
			matching_score
		} = req.body;

		const opportunity = await prisma.volunteerOpportunity.findUnique({
			where: { id },
		});

		if (!opportunity) {
			return res.status(404).json({
				status: false,
				message: "Opportunity not found"
			});
		}

    const updatedOpportunity = await prisma.volunteerOpportunity.update({
		where: { id },
		data: {
			title,
			description: description || opportunity.description,
			location: location || opportunity.location,
			category: category || opportunity.category,
			startDate: start_date
			? new Date(start_date)
			: opportunity.startDate,
			endDate: end_date
			? new Date(end_date)
			: opportunity.endDate,
			capacity: parseInt(capacity) || opportunity.capacity,
			requiredSkills: required_skills || opportunity.requiredSkills,
			matchingScore: parseFloat(matching_score) || opportunity.matchingScore
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
			},
		applications: true
		}
    });

	return res.status(200).json({
		status: true,
		data: updatedOpportunity,
		message: `opportunity has been updated`
    });
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const deleteOpportunity = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const opportunity = await prisma.volunteerOpportunity.findUnique({
			where: { id }
		});

		if (!opportunity) {
			return res.status(404).json({
			status: false,
			message: "Opportunity not found"
			});
		}

		const deletedOpportunity = await prisma.volunteerOpportunity.delete({
			where: { id }
		});

		return res.status(200).json({
			status: true,
			data: deletedOpportunity,
			message: "Opportunity deleted successfully"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const searchOpportunities = async (req: Request, res: Response) => {
	try {
		const { keyword, category, location, start_date, end_date } = req.query;

		const where: any = {};

		// Search by keyword in title or description
		if (keyword) {
			where.OR = [
			{ title: { contains: keyword as string, mode: 'insensitive' } },
			{ description: { contains: keyword as string, mode: 'insensitive' } }
			];
		}

		// Filter by category
		if (category) {
			where.category = category;
		}

		// Filter by location
		if (location) {
			where.location = { contains: location as string, mode: 'insensitive' };
		}

		// Filter by date range
		if (start_date) {
			where.startDate = { gte: new Date(start_date as string) };
		}
		if (end_date) {
			where.endDate = { lte: new Date(end_date as string) };
		}

		const opportunities = await prisma.volunteerOpportunity.findMany({
			where,
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
				},
				_count: {
					select: { applications: true }
				}
			},
				orderBy: {
				createdAt: 'desc'
			}
		});

		return res.status(200).json({
			status: true,
			data: opportunities,
			message: `found ${opportunities.length} opportunities`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};