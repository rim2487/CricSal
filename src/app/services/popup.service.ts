import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupSubject = new Subject<{ message: string, type: string }>();

  constructor() {
  }

  showPopup(message: string, type: string) {
    this.popupSubject.next({message, type});
  }

  getPopup() {
    return this.popupSubject.asObservable();
  }
}
