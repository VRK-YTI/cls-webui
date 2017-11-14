import { Component, Input } from '@angular/core';

type Status = 'SUPERSEDED'
            | 'REMOVED'
            | 'INCORRECT'
            | 'VALID'
            | 'DRAFT';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  template: `
    <span [class.bg-danger]="danger"
          [class.bg-warning]="warning"
          [class.bg-info]="info"
          [class.bg-success]="success"
          translate>{{status}}</span>
  `
})
export class StatusComponent {

  @Input() status: Status;

  get danger() {
    return this.status === 'INCORRECT' || this.status === 'REMOVED';
  }

  get warning() {
    return this.status === 'SUPERSEDED';
  }

  get info() {
    return this.status === 'DRAFT';
  }

  get success() {
    return this.status === 'VALID';
  }
}