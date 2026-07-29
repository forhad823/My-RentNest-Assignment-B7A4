import { ActiveStatus } from "../../../generated/prisma/enums";

export interface IUserStatusPayload {
  activeStatus?: ActiveStatus;
}
