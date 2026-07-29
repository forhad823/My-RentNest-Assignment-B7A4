import {
  PropertyAvailability,
  RentalRequestStatus,
} from "../../../generated/prisma/enums";

export interface IPropertyPayload {
  categoryId: string;
  title: string;
  location: string;
  price: number;
  bedroomCount: number;
  bathroomCount: number;
  amenities: string[];
  availabilityStatus?: PropertyAvailability;
}

export interface IUpdatePropertyPayload {
  categoryId?: string;
  title?: string;
  location?: string;
  price?: number;
  bedroomCount?: number;
  bathroomCount?: number;
  amenities?: string[];
  availabilityStatus?: PropertyAvailability;
}

export interface IUpdateRentalReqStatus {
  status: RentalRequestStatus;
}
