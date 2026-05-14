import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AccessRequest, CreateAccessRequest, ProcessAccessRequest } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AccessRequestService {
    constructor(private http: HttpClient) { }

    createRequest(request: CreateAccessRequest) {
        return this.http.post<AccessRequest>(`${environment.apiUrl}/requests`, request);
    }

    getMyRequests() {
        return this.http.get<AccessRequest[]>(`${environment.apiUrl}/requests/my`);
    }

    getAllRequests(status?: string) {
        let url = `${environment.apiUrl}/requests`;
        if (status) url += `?status=${status}`;
        return this.http.get<AccessRequest[]>(url);
    }

    processRequest(id: number, request: ProcessAccessRequest) {
        return this.http.post<AccessRequest>(`${environment.apiUrl}/requests/${id}/process`, request);
    }
}
