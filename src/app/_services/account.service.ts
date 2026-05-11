import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ActivityLog, ActivityLogsResponse } from '@app/_models/activity-log.model'; // Ensure this model exists
import { Account } from '@app/_models';

const baseUrl = `${environment.apiUrl}/Accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {
    private accountSubject: BehaviorSubject<Account | null>;
    public account: Observable<Account | null>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.accountSubject = new BehaviorSubject<Account | null>(null);
        this.account = this.accountSubject.asObservable();
    }

    public get accountValue() {
        return this.accountSubject.value;
    }

    login(email: string, password: string) {
        return this.http.post<any>(`${baseUrl}/authenticate`, { email, password }, { withCredentials: true })
            .pipe(map((response: any) => {
                const account = { ...response.account, jwtToken: response.jwtToken };
                this.accountSubject.next(account);
                localStorage.setItem('isLoggedIn', 'true');
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    logout() {
        this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
        this.stopRefreshTokenTimer();
        this.accountSubject.next(null);
        localStorage.removeItem('isLoggedIn');
        this.router.navigate(['/account/login']);
    }

    refreshToken() {
        return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { withCredentials: true })
            .pipe(map((response) => {
                const account = { ...response.account, jwtToken: response.jwtToken };
                this.accountSubject.next(account);
                this.startRefreshTokenTimer();
                return account;
            }));
    }

    register(account: Account) {
        return this.http.post(`${baseUrl}/register`, account);
    }

    verifyEmail(token: string) {
        return this.http.post(`${baseUrl}/verify-email`, { token });
    }

    forgotPassword(email: string) {
        return this.http.post(`${baseUrl}/forgot-password`, { email });
    }

    validateResetToken(token: string) {
        return this.http.post(`${baseUrl}/validate-reset-token`, { token });
    }

    resetPassword(token: string, password: string, confirmPassword: string) {
        return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword });
    }

    getAll(search?: string, isActive: boolean = true) {
        let url = `${baseUrl}?isActive=${isActive}`;
        if (search) {
            url += `&search=${search}`;
        }
        return this.http.get<Account[]>(url);
    }
    getAllActivityLogs(): Observable<ActivityLog[]> {
        return this.http.get<ActivityLogsResponse>(`${baseUrl}/activity-logs`).pipe(
            map((response: any) => {
                return response.data?.logs || [];
            })
        );
    }
    getActivityLogs(accountId: number, filters: any = {}): Observable<ActivityLog[]> {
        return this.http.post<any>(`${baseUrl}/${accountId}/activity`, filters).pipe(
            map((response: any) => response.logs || [])
        );
    }

    getById(accountId: number) {
        return this.http.get<Account>(`${baseUrl}/${accountId}`);
    }

    create(params: any) {
        return this.http.post(baseUrl, params);
    }

    update(accountId: number, params: any) {
        return this.http.put(`${baseUrl}/${accountId}`, params)
            .pipe(map((res: any) => {
                const account = res.account;
                // update the current account if it was updated
                if (account?.accountId === this.accountValue?.accountId) {
                    // publish updated account to subscribers
                    const updatedAccount = { ...this.accountValue, ...account };
                    this.accountSubject.next(updatedAccount);
                }
                return account;
            }));
    }

    delete(accountId: number) {
        return this.http.delete(`${baseUrl}/${accountId}`)
            .pipe(finalize(() => {
                // auto logout if the logged in account was deleted
                if (accountId === this.accountValue?.accountId)
                    this.logout();
            }));
    }

    // helper methods

    private refreshTokenTimeout?: any;

    private startRefreshTokenTimer() {
        // parse json object from base64 encoded jwt token
        const jwtBase64 = this.accountValue!.jwtToken!.split('.')[1];
        const jwtToken = JSON.parse(atob(jwtBase64));

        // set a timeout to refresh the token a minute before it expires
        const expires = new Date(jwtToken.exp * 1000);
        const timeout = expires.getTime() - Date.now() - (60 * 1000);
        this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
    }

    private stopRefreshTokenTimer() {
        clearTimeout(this.refreshTokenTimeout);
    }
    getAccountsByRoom(roomId: number) {
        return this.http.get<any[]>(`${environment.apiUrl}/Accounts/room/${roomId}`);
    }
    getUnassignedAccounts(roomId: number, search: string = '') {
        return this.http.get<any[]>(`${environment.apiUrl}/Accounts/unassigned/${roomId}?search=${search}`);
    }
    addRoom(accountId: number, roomId: number) {
        return this.http.post(`${environment.apiUrl}/Accounts/${accountId}/rooms/${roomId}`, {});
    }
    removeRoom(accountId: number, roomId: number) {
        return this.http.delete(`${environment.apiUrl}/Accounts/${accountId}/rooms/${roomId}`);
    }
    getAccountCount() {
        return this.http.get<{ count: number }>(`${environment.apiUrl}/accounts/count`);
    }

}
