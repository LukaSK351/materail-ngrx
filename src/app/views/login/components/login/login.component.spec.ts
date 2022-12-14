import { ComponentFixture, TestBed, tick } from '@angular/core/testing';

import { Location } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { routes } from 'src/app/app-routing.module';
import { loggedUsersSelector } from 'src/app/store/loggedUser/users/loggedUser.selectors';
import { LoginComponent } from './login.component';
import { LoggedUserStateInterface } from 'src/app/models/stateModels/LoggedUserStateInterface';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let store: MockStore;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [RouterTestingModule.withRoutes(routes)],
      providers: [provideMockStore({ initialState: [] })],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    let user: LoggedUserStateInterface = {
      error: '',
      isLoading: false,
      user: {
        login: 'TestUser',
        followers: 1,
        avatar_url: 'https://avatars.githubusercontent.com/u/9919?s=40&v=4',
        id: 2,
        name: 'test user',
        public_repos: -1,
      },
    };

    location = TestBed.inject(Location);
    store = TestBed.inject(MockStore);
    store.overrideSelector(loggedUsersSelector, user);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('when logged user than redirect ', fakeAsync(() => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/users']);
  }));

  it('when destroy than unsubscribe', () => {
    component.ngOnDestroy();
    expect(component.loggedUser$.closed).toBe(true);
  });
  it('when setUser than dispatch called', () => {
    const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    component.setUser();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
  it('when user click on login, than token should be dispatch to effect', () => {
    const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    component.loginForm.patchValue({
      token: 'test token',
    });
    component.login();
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });
});
