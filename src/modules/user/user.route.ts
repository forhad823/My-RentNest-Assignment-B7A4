import { NextFunction, Request, Response, Router } from "express";
import { userController } from "./user.controller";
import config from "../../config";
import { jwtUtils } from "../../utils/jwt";
import { Role } from "../../../generated/prisma/enums";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { auth } from "../../middlewares/auth";

const router = Router();

// global type augmentation (or declaration merging)
declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        name: string;
        id: string;
        role: Role;
      };
    }
  }
}

router.post("/register", userController.registerUser);

// getting logged-in profile
router.get(
  "/me",
  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.getMyProfile,
);

// updating logged-in profile
router.put(
  "/my-profile",
  auth(Role.ADMIN, Role.USER, Role.AUTHOR),
  userController.updateMyProfile,
);

export const userRoutes = router;

/* 
 ### What this code does:                                                                     
                                                                                               
  This code extracts an authentication security token (called accessToken) sent by the client  
  (frontend) to verify who is making the request. It checks three different places where the   
  client might have sent the token:                                                            
                                                                                               
    const token = req.cookies.accessToken // 1. Try to get it from Cookies                     
      ? req.cookies.accessToken                                                                
      : req.headers.authorization?.startsWith("Bearer ") // 2. Try to get it from a Bearer     
  Authorization header                                                                         
        ? req.headers.authorization?.split(" ")[1] // (Extracts the token part after "Bearer ")
        : req.headers.authorization; // 3. Try to get it from a raw Authorization header       
                                                                                               
  ### Line-by-Line Breakdown:                                                                  
                                                                                               
  1. req.cookies.accessToken ? req.cookies.accessToken : ...                                   
      • Step 1: The code first checks if the token is saved in the browser's cookies under the 
      name accessToken. If it finds it there, it uses it immediately.                          
  2. req.headers.authorization?.startsWith("Bearer ") ? ...                                    
      • Step 2: If the cookie doesn't exist, it checks the HTTP request headers (specifically, 
      the Authorization header).                                                               
      • If the header is formatted as a "Bearer" token (e.g., "Bearer eyJhbGciOi..."), it      
      proceeds to extract it.                                                                  
  3. req.headers.authorization?.split(" ")[1]                                                  
      • Step 3: The code splits the string "Bearer <TOKEN>" at the space and takes the second  
      part ([1]), which is the actual token string.                                            
  4. : req.headers.authorization
      • Step 4: If the Authorization header exists but doesn't start with "Bearer ", it simply 
      returns the raw value of that header directly.
  
  
  ### Why is it written this way?
  
  It makes the backend flexible! It allows the server to authenticate requests whether they    
  come from:
  
  • A web browser (which automatically sends Cookies).
  • A mobile app or API client (which usually sends the token in the Authorization Header).  

*/
