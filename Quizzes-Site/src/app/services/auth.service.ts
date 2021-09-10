import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import * as firebase from 'firebase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private userDetails$: Subject<any> = new Subject<any>();

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
    const savedUserString = localStorage.getItem('user');
    if (savedUserString !== null) {
      this.isLoggedIn$.next(true);
    }

    afAuth.authState.subscribe((user) => {
      if (!!user) {
        this.userDetails$.next(<any>user);
        const userString: string = JSON.stringify(user);
        localStorage.setItem('user', userString);
        this.isLoggedIn$.next(true);
      } else {
        localStorage.removeItem('user');
        this.isLoggedIn$.next(false);
      }
    });
  }

  public signInWithGoogle() {
    this.authLogin(new firebase.default.auth.GoogleAuthProvider());
  }

  public signOut(): Promise<void> {
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/']);
      this.userDetails$.next(undefined);
    });
  }

  public isLoggedIn(): Observable<boolean> {
    return this.isLoggedIn$.asObservable();
  }

  public getUserData(): Observable<any> {
    return this.userDetails$.asObservable();
  }

  private authLogin(provider: firebase.default.auth.AuthProvider) {
    return this.afAuth.signInWithPopup(provider).then((res) => {
      this.isLoggedIn$.next(true);
      this.setUserData(res.user as any);
      this.router.navigate(['chat']);
    });
  }

  private setUserData(user?: any): Promise<void> | void {
    if (!user) return;
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );

    const userData: any = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };

    return userRef.set(userData, {
      merge: true,
    });
  }
}
