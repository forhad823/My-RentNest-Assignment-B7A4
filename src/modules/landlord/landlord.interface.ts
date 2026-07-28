import { PropertyAvailability } from "../../../generated/prisma/enums";

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
