export class UserProfileDto {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  description: string | null;
  img: string | null;
  isActive: boolean;
  lastSeen: Date | null;
  createdAt: Date;
}
