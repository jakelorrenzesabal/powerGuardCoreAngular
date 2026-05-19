export interface AccessRequest {
    requestId: number;
    accountId: number;
    userName?: string;
    userEmail?: string;
    roomId: number;
    roomName?: string;
    requestType: string;
    requestedStartDate?: string;
    requestedExpiryDate?: string;
    status: string;
    reason?: string;
    adminComment?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAccessRequest {
    roomId: number;
    requestType: string;
    requestedStartDate?: string;
    requestedExpiryDate?: string;
    reason?: string;
}

export interface ProcessAccessRequest {
    status: string;
    adminComment?: string;
}
