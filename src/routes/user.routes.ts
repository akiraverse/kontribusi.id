import express from "express";
import { 
	getAllUser, 
	getUserById, 
	createUser, 
	updateUser, 
	deleteUser, 
	authentication } from "../controllers/user.controller";
import { verifyToken, verifyRole } from "../middleware/authorization";
import { verifyAuthentication, verifyAddUser, verifyEditUser } from "../middleware/userValidation";
import uploadFile from "../middleware/uploadFile";

import { Role } from "@prisma/client";

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/', getAllUser)
app.get('/:id', getUserById)
app.post('/', uploadFile.single("file"), createUser, verifyAddUser)
app.put('/:id', [verifyToken, verifyRole([Role.organization, Role.society])], uploadFile.single("file"), updateUser, verifyEditUser)
app.delete('/:id', [verifyToken, verifyRole([Role.organization, Role.society])], deleteUser)
app.post('/login', authentication, verifyAuthentication)

export default app;