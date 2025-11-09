import path from "path";

/** define path (address) of root folder */
export const BASE_URL = `${path.join(__dirname, "../")}`

export const PORT = process.env.PORT || 8000

export const SECRET = process.env.SECRET || "moklet"

