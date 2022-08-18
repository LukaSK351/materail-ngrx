import {} from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, OnInit } from '@angular/core';
import { Route, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, merge, map, take } from 'rxjs';
import { DynamicFlatNode } from 'src/app/models/DynamicFlatNode';
import { User } from 'src/app/models/User';

import { GithubService } from 'src/app/services/github.service';
import {
  addFullUser,
  addNewUsers,
  retrieveFullUserList,
  setLoggedUser,
} from 'src/app/store/users/user.actions';
import {
  selectFullUser,
  selectLoggedUser,
  selectUsers,
} from 'src/app/store/users/user.selectors';
import { FullUser } from '../../../models/FullUser';
import { DynamicDataSource } from './dynamicDataSource';

@Component({
  selector: 'app-users-tree',
  templateUrl: './users-tree.component.html',
  styleUrls: ['./users-tree.component.scss'],
})
export class UsersTreeComponent implements OnInit {
  loggedUser: User;

  treeControl: FlatTreeControl<DynamicFlatNode>;
  dataSource: DynamicDataSource;
  loading = false;

  selectedUser: User | null;

  selectedNode: DynamicFlatNode = {
    expandable: false,
    isLoading: false,
    level: -1,
    user: {
      email: '',
      fulllName: '',
      id: -1,
      login: '',
      profileImg: '',
      repos_url: '',
    },
  };

  constructor(
    private githubService: GithubService,
    private store: Store,
    private router: Router
  ) {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new DynamicDataSource(
      this.treeControl,
      this.githubService,
      store
    );
  }

  ngOnInit(): void {
    let test = 0;
    this.store.select(selectUsers).subscribe((users) => {
      if (test < 25) {
        this.dataSource.data = [...users];
        test++;
      }
    });

    this.store
      .select(selectLoggedUser)
      .pipe(take(1))
      .subscribe((loggedUser) => {
        if (loggedUser.id >= 0) {
          this.loggedUser = loggedUser;
        } else {
          this.loggedUser = {
            login: 'Unknown',
            followers: -1,
            avatar_url: 'https://avatars.githubusercontent.com/u/9919?s=40&v=4',
            id: -1,
            name: 'Unknown user',
            public_repos: -1,
          };
        }
      });

    if (this.dataSource.data.length === 0) {
      this.githubService.getUsers(0).subscribe((allUsers) => {
        const myselect: DynamicFlatNode[] = allUsers.map((p: FullUser) => {
          return {
            level: 1,
            expandable: true,
            isLoading: false,
            user: p,
          };
        });
        myselect.forEach((oneUser) => {
          this.store.dispatch(addNewUsers({ users: oneUser }));
        });
      });
    }
  }

  loadMoreUsers() {
    // const lastUserId = Math.max(...this.dataSource.data.map((o) => o.user.id));
    // this.githubService
    //   .getUsers(lastUserId)
    //   .pipe(take(1))
    //   .subscribe((allUsers) => {
    //     const myselect: DynamicFlatNode[] = allUsers.map((p: FullUser) => {
    //       return {
    //         level: 1,
    //         expandable: true,
    //         isLoading: false,
    //         user: p,
    //       };
    //     });
    //     myselect.forEach((oneUser) => {
    //       this.store.dispatch(addNewUsers({ users: oneUser }));
    //     });
    //   });
  }

  handleChange(node: DynamicFlatNode) {
    if (
      this.selectedNode.user &&
      this.selectedNode.user?.id === node.user?.id
    ) {
      let user = {
        email: '',
        fulllName: '',
        id: -1,
        login: '',
        profileImg: '',
        repos_url: '',
      };
      this.selectedNode = { ...this.selectedNode, user };
      this.selectedUser = null;
    } else {
      this.selectedUser = null;
      this.selectedNode = { ...node };
      this.getUser();
    }
  }

  getUser() {
    this.store.select(selectFullUser).subscribe((users) => {
      const myUSer = users.find(
        (oneUser) => oneUser.id === this.selectedNode.user?.id
      );
      if (!myUSer) {
        this.loadFullUser();
      } else {
        this.selectedUser = { ...myUSer };
      }
    });
  }

  loadFullUser() {
    if (this.selectedNode.user)
      this.githubService
        .getFullUser(this.selectedNode.user.login)
        .subscribe((user) => {
          this.store.dispatch(addFullUser({ user: user }));
        });
  }

  setUserInStore(dynamicNode: DynamicFlatNode) {
    if (dynamicNode.user) {
      this.loading = true;
      this.router.navigate(['/users/' + dynamicNode.user.login]).then(() => {
        this.loading = false;
      });
    }
  }

  getLevel = (node: DynamicFlatNode) => {
    return node.level;
  };

  isExpandable = (node: DynamicFlatNode) => {
    return node.expandable;
  };

  hasChild = (_: number, _nodeData: DynamicFlatNode) => {
    return _nodeData.expandable;
  };
}
