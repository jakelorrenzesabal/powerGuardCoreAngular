import { Role } from './role';
import { Room } from './room';

export class Account {
    accountId?: number;
    title?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: Role;
    jwtToken?: string;
    phoneNumber?: string;
    uid?: string;
    rooms?: Room[];
}