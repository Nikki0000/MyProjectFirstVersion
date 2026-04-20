export type UserRole = "Customer" | "Wrapper" | "Admin";

export type OrderStatus = "Open" | "InProgress" | "Completed" | "Cancelled";

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface OrderResponseView {
  responseId: string;
  userId: string;
  userName: string;
  message: string;
  proposedPrice: number | null;
  createdUtc: string;
}

export interface OrderView {
  id: string;
  title: string;
  description: string;
  city: string;
  budget: number;
  plannedDate: string | null;
  status: OrderStatus;
  createdByUserId: string;
  createdByName: string;
  createdUtc: string;
  responsesCount: number;
  isFavoritedByCurrentUser: boolean;
  responses: OrderResponseView[];
}

export interface ProfileView {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdOrders: number;
  responses: number;
  favorites: number;
}
