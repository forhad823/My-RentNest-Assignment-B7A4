import { prisma } from "../../lib/prisma";


// GET	/api/admin/users	ADMIN	None	Gets a list of all tenants and landlords in the system.


// PATCH	/api/admin/users/:id	ADMIN	{ status } (ACTIVE or BLOCKED)	Bans or unbans a user account.

// GET	/api/admin/properties	ADMIN	None	Monitor all listed properties on the platform.

// GET	/api/admin/rentals	ADMIN	None	Oversees all rental requests across all landlords and tenants.