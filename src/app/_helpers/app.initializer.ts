import { catchError, of } from 'rxjs';

import { AccountService } from '@app/_services';

export function appInitializer(accountService: AccountService) {
    return () => {
        if (localStorage.getItem('isLoggedIn') === 'true') {
            return accountService.refreshToken()
                .pipe(
                    catchError(() => {
                        localStorage.removeItem('isLoggedIn');
                        return of();
                    })
                );
        }
        return of();
    };
}