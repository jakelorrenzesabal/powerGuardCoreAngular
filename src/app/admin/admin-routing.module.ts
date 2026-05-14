import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubNavComponent } from './subnav.component';
import { LayoutComponent } from './layout.component';

import { BlockedUidsComponent } from './blocked-uids/blocked-uids.component';
import { AccessRequestListComponent } from './requests/access-request-list.component';

const accountsModule = () => import('./accounts/accounts.module').then(x => x.AccountsModule);

const routes: Routes = [
    { path: '', component: SubNavComponent, outlet: 'subnav' },
    {
        path: '', component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'accounts', pathMatch: 'full' },
            { path: 'accounts', loadChildren: accountsModule },
            { path: 'blocked-uids', component: BlockedUidsComponent },
            { path: 'access-requests', component: AccessRequestListComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }