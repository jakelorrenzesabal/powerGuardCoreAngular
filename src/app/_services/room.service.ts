import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Room } from '@app/_models/room';

export interface RoomLog {
    userName: string;
    event: string;
    timestamp: string;
    details: string;
    roomName: string; // Add this property
}

export interface LogFilter {
    roomName?: string;
    event?: string;
    startDate?: string;
    endDate?: string;
}

const baseUrl = `${environment.apiUrl}/room`;

@Injectable({ providedIn: 'root' })
export class RoomService {
    private roomSubject: BehaviorSubject<Room | null>;
    public room: Observable<Room | null>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.roomSubject = new BehaviorSubject<Room | null>(null);
        this.room = this.roomSubject.asObservable();
    }

    public get roomValue() {
        return this.roomSubject.value;
    }

    getAllRooms(): Observable<Room[]> {
        return this.http.get<any>(baseUrl).pipe(
            map(response => response.rooms)
        );
    }

    getRoomById(roomId: number): Observable<Room> {
        return this.http.get<any>(`${baseUrl}/${roomId}`).pipe(
            map(response => response.room)
        );
    }

    create(params: any): Observable<any> {
        return this.http.post<any>(baseUrl, params);
    }

    update(roomId: number, params: any): Observable<Room> {
        return this.http.put<any>(`${baseUrl}/${roomId}`, params).pipe(
            map(response => {
                const room = response.room;
                if (room?.roomId === this.roomValue?.roomId) {
                    const updatedRoom = { ...this.roomValue, ...room };
                    this.roomSubject.next(updatedRoom);
                }
                return room;
            })
        );
    }

    delete(roomId: number): Observable<any> {
        return this.http.delete<any>(`${baseUrl}/${roomId}`);
    }

    getRoomLogs(roomId: number, filters: LogFilter = {}) {
        let url = `${environment.apiUrl}/arduino/log/room/${roomId}`;

        // Add query parameters for filtering
        const params: Record<string, string> = {};
        if (filters.event) params.event = filters.event;
        if (filters.roomName) params.roomName = filters.roomName;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        // Build query string
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return this.http.get<RoomLog[]>(url);
    }

    getAllArduinoLogs(filters: LogFilter = {}) {
        let url = `${environment.apiUrl}/arduino/log`;

        // Add query parameters for filtering
        const params: Record<string, string> = {};
        if (filters.event) params.event = filters.event;
        if (filters.roomName) params.roomName = filters.roomName;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        // Build query string
        const queryString = new URLSearchParams(params).toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return this.http.get<{ success: boolean, logs: RoomLog[] }>(url);
    }

    toggleRoomStatus(roomId: number, isActive: boolean): Observable<any> {
        return this.http.put<any>(`${baseUrl}/${roomId}/status`, { isActive });
    }

    togglePowerStatus(roomId: number, status: 'on' | 'off'): Observable<any> {
        return this.http.patch<any>(`${baseUrl}/${roomId}/power`, { status });
    }

    getRoomsByPowerStatus(status: 'on' | 'off') {
        return this.http.get<any>(`${baseUrl}/status/${status}`);
    }
    getLogCounts(params: any = {}) {
        let url = `${environment.apiUrl}/arduino/log/counts`;
        const queryString = new URLSearchParams(params).toString();
        if (queryString) url += `?${queryString}`;
        return this.http.get<any>(url);
    }
    getValidationAttempts(roomId: number) {
        return this.http.get<any[]>(`${baseUrl}/${roomId}/validation-attempts`);
    }
    getBlockedUids() {
        return this.http.get<{ success: boolean, uids: any[] }>(`${environment.apiUrl}/arduino/log/blocked`);
    }

    unblockUid(uid: string) {
        return this.http.post<any>(`${environment.apiUrl}/arduino/log/unblock`, { uid });
    }
}
