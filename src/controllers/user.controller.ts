import { PrismaClient, Role } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { SECRET } from "../global";

const prisma = new PrismaClient();

export const getAllUser = async (_req: Request, res: Response) => {
	try {
		const users = await prisma.user.findMany({
			include: {
				volunteerProfile: true,
				organizationProfile: true
			}
		});

		return res.status(200).json({
			status: true,
			data: users,
			message: `all users retrieved`
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const getUserById = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const user = await prisma.user.findUnique({
			where: { id: Number(id) },
			include: {
			volunteerProfile: {
				include: {
					portfolios: true,
					applications: {
						include: {
							opportunity: true
						}
					}
				}
			},
			organizationProfile: {
				include: {
					opportunities: true,
					impactAnalyses: true
				}
			}
		}
	});

	if (!user) {
		return res.status(404).json({
			status: false,
			message: "User not found"
		});
	}

	return res.status(200).json({
		status: true,
		data: user,
		message: `user id ${id} retrieved`
	});

	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const createUser = async (req: Request, res: Response) => {
	try {
		const {
			name,
			email,
			password,
			role,
			// Volunteer inquiries
			location,
			date_of_birth,
			gender,
			available_day,
			interests,
			skills,
			availableTimeIds,
			// Organization inquiries
			org_name,
			address,
			phone,
			description
		} = req.body;

		const file = req.file ? req.file.filename : null;

		if (!name || !email || !password || !role) {
			return res.status(400).json({
				status: false,
				message: "Missing required fields: name, email, password, role"
			});
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return res.status(400).json({
				status: false,
				message: "Email already registered"
			});
		}

		const hashedPassword = bcrypt.hashSync(password, 10);


		const userData: any = {
			name,
			email,
			password: hashedPassword,
			role,
			file
		};

	
		if (role === Role.volunteer) {
			userData.volunteerProfile = {
				create: {
					location: location || null,
					dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
					gender: gender || null,
					availableDay: available_day || null,
					interests: interests || [],
					skills: skills || [],
					availableTimes: availableTimeIds
					? {
						connect: availableTimeIds.map((id: number) => ({ id })),
					}
					: undefined,
				}
			};

			
		} else if (role === Role.organization) {
			if (!org_name) {
				return res.status(400).json({
					status: false,
					message: "Organization name is required for organization role"
				});
			}
			userData.organizationProfile = {
				create: {
					name: org_name,
					address: address || null,
					phone: phone || null,
					description: description || null
				}
			};
		}

	
		const user = await prisma.user.create({
			data: userData,
			include: {
			volunteerProfile: true,
			organizationProfile: true
			}
		});
	
		const { password: _, ...userWithoutPassword } = user;

		if (availableTimeIds && availableTimeIds.length > 0) {
			await prisma.$transaction(
				availableTimeIds.map((id: number) =>
					prisma.availableTime.update({
					where: { id },
					data: { usageCountVolunteer: { increment: 1 } },
					})
				)
			);
		}

		return res.status(201).json({
			status: true,
			data: userWithoutPassword,
			message: `a user has been created`
		});
	} catch (error) {
		console.error(error);
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const updateUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const {
			name,
			email,
			password,
			// Volunteer inquiries
			location,
			date_of_birth,
			gender,
			available_day,
			interests,
			skills,
			// Organization inquiries
			org_name,
			address,
			phone,
			description
		} = req.body;

		const user = await prisma.user.findUnique({
			where: { id: Number(id) },
				include: {
					volunteerProfile: true,
					organizationProfile: true
				}
		});

		if (!user) {
			return res.status(404).json({
			status: false,
			message: "User not found"
			});
		}

		const file = req.file ? req.file.filename : undefined;

		const updatedData: any = {
			name: name || user.name,
			email: email || user.email,
			file: file || user.file
		};


		if (password) {
			updatedData.password = bcrypt.hashSync(password, 10);
		}

	// Update profile based on role
	if (user.role === Role.volunteer && user.volunteerProfile) {

		updatedData.volunteerProfile = {
			update: {
				location: location || user.volunteerProfile.location,
				dateOfBirth: date_of_birth ? new Date(date_of_birth) 
				: user.volunteerProfile.dateOfBirth,
				gender: gender || user.volunteerProfile.gender,
				availableDay: available_day || user.volunteerProfile.availableDay,
				interests: interests || user.volunteerProfile.interests,
				skills: skills || user.volunteerProfile.skills
			}
		};
	} else if (user.role === Role.organization && user.organizationProfile) {

		updatedData.organizationProfile = {
			update: {
				name: org_name || user.organizationProfile.name,
				address: address || user.organizationProfile.address,
				phone: phone || user.organizationProfile.phone,
				description: description || user.organizationProfile.description
			}
		};
	}

	// Update user
	const updatedUser = await prisma.user.update({
		where: { id: Number(id) },
		data: updatedData,
		include: {
			volunteerProfile: true,
			organizationProfile: true
		}
	});

	const { password: _, ...userWithoutPassword } = updatedUser;

	return res.status(200).json({
		status: true,
		data: userWithoutPassword,
		message: `user has been updated`
	});
	} catch (error) {
		console.log(error)
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const user = await prisma.user.findUnique({ where: { id: Number(id) } });

		if (!user) {
			return res.status(404).json({
				status: false,
				message: "User not found"
			});
		}

		const deletedUser = await prisma.user.delete({ where: { id: Number(id) } });

		const { password: _, ...userWithoutPassword } = deletedUser;

		return res.status(200).json({
			status: true,
			data: userWithoutPassword,
			message: "User deleted successfully"
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};

export const authentication = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
			status: false,
			logged: false,
			message: "Email and password are required"
			});
		}

		const findUser = await prisma.user.findFirst({
			where: { email },
			include: {
				volunteerProfile: true,
				organizationProfile: true
			}
		});

		if (!findUser) {
			return res.status(401).json({
				status: false,
				logged: false,
				message: "Email or password is invalid"
			});
		}

		const isPasswordValid = bcrypt.compareSync(password, findUser.password);

		if (!isPasswordValid) {
			return res.status(401).json({
				status: false,
				logged: false,
				message: "Email or password is invalid"
			});
		}

		const data = {
			id: findUser.id,
			name: findUser.name,
			email: findUser.email,
			role: findUser.role
		};

		const payload = JSON.stringify(data);
		const token = sign(payload, SECRET || "joss");

		const { password: _, ...userWithoutPassword } = findUser;

		return res.status(200).json({
			status: true,
			logged: true,
			data: userWithoutPassword,
			message: "Login Success",
			token: token
		});
	} catch (error) {
		return res.status(400).json({
			status: false,
			message: `error: ${error}`
		});
	}
};