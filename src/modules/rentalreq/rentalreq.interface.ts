import { RentalRequestStatus } from "../../../generated/prisma/enums";

export interface ISubmitRentalReqPayload {
  propertyId: string;
  rentAmount: number;
}

//     rentAmount Float
//     status     RentalRequestStatus @default(PENDING)
//     createdAt  DateTime            @default(now())
//     updatedAt  DateTime            @updatedAt

//     propertyId String
//     property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

//     tenantId String
//     tenant   User @relation(fields: [tenantId], references: [id], onDelete: Cascade)
