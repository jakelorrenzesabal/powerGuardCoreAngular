import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';
import { Subject } from 'rxjs';
declare var bootstrap: any;
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    templateUrl: 'list.component.html',
    styleUrls: ['list.component.less']
})
export class ListComponent implements OnInit {
    accounts?: any[];
    inactiveAccounts: any[] = [];
    inactiveModal: any;
    loadingInactive = false;
    selectedAccount: any = null;
    deactivateModal: any;
    searchTerm: string = '';
    inactiveSearchTerm: string = '';
    private searchSubject: Subject<string> = new Subject<string>();
    private inactiveSearchSubject: Subject<string> = new Subject<string>();
    currentAccount: any;

    constructor(private accountService: AccountService) { }

    ngOnInit() {
        this.accountService.account.subscribe((account: any) => {
            this.currentAccount = account;
        });

        this.loadAccounts();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe((searchTerm: string) => {
            this.searchTerm = searchTerm;
            this.loadAccounts();
        });

        this.inactiveSearchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe((searchText: string) => {
            this.inactiveSearchTerm = searchText;
            this.loadInactiveAccounts(searchText);
        });
    }

    loadAccounts() {
        this.accountService.getAll(this.searchTerm)
            .pipe(first())
            .subscribe((accounts: any[]) => this.accounts = accounts);
    }

    onSearch(event: any) {
        const value = event.target.value;
        this.searchSubject.next(value);
    }

    confirmDeactivation(account: any) {
        this.selectedAccount = account;
        const modalElement = document.getElementById('deactivateModal');
        if (modalElement) {
            this.deactivateModal = new bootstrap.Modal(modalElement);
            this.deactivateModal.show();
        }
    }

    openInactiveModal() {
        this.inactiveSearchTerm = '';
        this.loadInactiveAccounts();
        const modalElement = document.getElementById('inactiveAccountsModal');
        if (modalElement) {
            this.inactiveModal = new bootstrap.Modal(modalElement);
            this.inactiveModal.show();
        }
    }

    loadInactiveAccounts(search?: string) {
        this.loadingInactive = true;
        this.accountService.getAll(search, false)
            .pipe(first())
            .subscribe((accounts: any[]) => {
                this.inactiveAccounts = accounts;
                this.loadingInactive = false;
            });
    }

    onInactiveSearch(event: any) {
        const value = (event.target as HTMLInputElement).value;
        this.inactiveSearchSubject.next(value);
    }

    reactivateAccount(accountId: number) {
        const account: any = this.inactiveAccounts.find((x: any) => x.accountId === accountId);
        if (account) account.isReactivating = true;

        this.accountService.update(accountId, { isActive: true })
            .pipe(first())
            .subscribe(() => {
                this.loadAccounts();
                this.loadInactiveAccounts();
            });
    }

    deleteAccount(accountId: number) {
        const account = this.accounts!.find(x => x.accountId === accountId);
        account.isDeleting = true;
        this.accountService.delete(accountId)
            .pipe(first())
            .subscribe(() => {
                this.accounts = this.accounts!.filter(x => x.accountId !== accountId)
            });
    }
}