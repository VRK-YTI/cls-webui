import { Component, Input, OnInit, Optional, Self } from '@angular/core';
import { Code } from '../../entities/code';
import { EditableService } from '../../services/editable.service';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { SearchLinkedCodeModalService } from './search-linked-code-modal.component';
import { DataService } from '../../services/data.service';
import { Observable } from 'rxjs';
import { TranslateService } from 'ng2-translate';
import { CodePlain } from '../../entities/code-simple';
import { CodeScheme } from '../../entities/code-scheme';

function addToControl<T>(control: FormControl, item: T) {

  control.setValue(item);
}

function removeFromControl<T>(control: FormControl) {

  control.setValue(null);
}

@Component({
  selector: 'app-code-input',
  template: `
    <dl *ngIf="editing || code">
      <dt>
        <label>{{label}}</label>
      </dt>
      <dd>
        <div *ngIf="!editing && code">
          <span>{{code.codeValue}} - {{code.prefLabel | translateValue:true}}</span>
        </div>
        <div *ngIf="editing && code">
          <a>
            <i id="{{'remove_code_link'}}"
               class="fa fa-times"
               (click)="removeCode(code)"></i>
          </a>
          <span>{{code.codeValue}} - {{code.prefLabel | translateValue:true}}</span>
          <app-error-messages id="code_error_messages" [control]="parentControl"></app-error-messages>
        </div>

        <button id="add_code_button"
                type="button"
                class="btn btn-sm btn-action mt-2"
                *ngIf="editing"
                (click)="selectCode()" translate>Select code
        </button>
      </dd>
    </dl>
  `
})
export class CodeInputComponent implements ControlValueAccessor {

  @Input() label: string;
  @Input() codeScheme: CodeScheme;
  control = new FormControl(null);

  private propagateChange: (fn: any) => void = () => {};
  private propagateTouched: (fn: any) => void = () => {};

  constructor(@Self() @Optional() public parentControl: NgControl,
              private editableService: EditableService,
              private translateService: TranslateService,
              private dataService: DataService,
              private searchLinkedCodeModalService: SearchLinkedCodeModalService) {

    this.control.valueChanges.subscribe(x => this.propagateChange(x));

    if (parentControl) {
      parentControl.valueAccessor = this;
    }
  }

  get code() {
    return this.control.value as CodePlain;
  }

  selectCode() {
    const titleLabel = this.translateService.instant('Choose code');
    const searchlabel = this.translateService.instant('Search code');
    const codes = this.dataService.getCodes(this.codeScheme.codeRegistry.codeValue, this.codeScheme.codeValue);

    this.searchLinkedCodeModalService.open(codes, titleLabel, searchlabel, [], true)
      .then(code => addToControl(this.control, code), ignoreModalClose);
  }

  removeCode() {
    removeFromControl(this.control);
  }

  get editing() {
    return this.editableService.editing;
  }

  writeValue(obj: any): void {
    this.control.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.propagateTouched = fn;
  }
}