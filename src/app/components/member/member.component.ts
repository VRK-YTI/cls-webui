import { Component, OnInit, ViewChild } from '@angular/core';
import { DataService } from '../../services/data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { EditableService, EditingComponent } from '../../services/editable.service';
import { NgbTabChangeEvent, NgbTabset } from '@ng-bootstrap/ng-bootstrap';
import { ignoreModalClose } from 'yti-common-ui/utils/modal';
import { Observable } from 'rxjs';
import { UserService } from 'yti-common-ui/services/user.service';
import { CodeListErrorModalService } from '../common/error-modal.service';
import { CodeListConfirmationModalService } from '../common/confirmation-modal.service';
import { AuthorizationManager } from '../../services/authorization-manager.service';
import { Member } from '../../entities/member';
import { Extension } from '../../entities/extension';
import { LanguageService } from '../../services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs/operators';
import { MemberValueType } from '../../services/api-schema';
import { MemberValue } from '../../entities/member-value';
import { ValueType } from '../../entities/value-type';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss'],
  providers: [EditableService]
})
export class MemberComponent implements OnInit, EditingComponent {

  @ViewChild('tabSet') tabSet: NgbTabset;

  member: Member;
  extension: Extension;

  constructor(private userService: UserService,
              private dataService: DataService,
              private route: ActivatedRoute,
              private router: Router,
              private locationService: LocationService,
              private editableService: EditableService,
              private confirmationModalService: CodeListConfirmationModalService,
              private errorModalService: CodeListErrorModalService,
              private authorizationManager: AuthorizationManager,
              public languageService: LanguageService,
              public translateService: TranslateService) {

    editableService.onSave = (formValue: any) => this.save(formValue);
  }

  ngOnInit() {

    const registryCodeValue = this.route.snapshot.params.registryCode;
    const schemeCodeValue = this.route.snapshot.params.schemeCode;
    const extensionCodeValue = this.route.snapshot.params.extensionCode;
    const memberId = this.route.snapshot.params.memberId;

    if (!memberId || !registryCodeValue || !schemeCodeValue || !extensionCodeValue) {
      throw new Error(`Illegal route, memberId: '${memberId}', registry: '${registryCodeValue}', ` +
        `scheme: '${schemeCodeValue}', extension: '${extensionCodeValue}'`);
    }

    this.dataService.getMember(memberId).subscribe(extension => {
      this.member = extension;
      this.locationService.atMemberPage(extension);
    });

    this.dataService.getExtension(registryCodeValue, schemeCodeValue, extensionCodeValue).subscribe(extension => {
      this.extension = extension;
    });
  }

  get loading(): boolean {

    return this.member == null || this.extension == null;
  }

  onTabChange(event: NgbTabChangeEvent) {

    if (this.isEditing()) {
      event.preventDefault();

      this.confirmationModalService.openEditInProgress()
        .then(() => {
          this.cancelEditing();
          this.tabSet.activeId = event.nextId;
        }, ignoreModalClose);
    }
  }

  back() {

    this.router.navigate(this.extension.route);
  }

  isEditing(): boolean {

    return this.editableService.editing;
  }

  navigateToRoute(route: any[]) {

    this.router.navigate(route);
  }

  get showMenu(): boolean {

    return this.canDelete;
  }

  get canDelete() {

    return this.userService.user.superuser ||
      (this.authorizationManager.canDelete(this.extension.parentCodeScheme) &&
        (this.extension.status === 'INCOMPLETE' ||
          this.extension.status === 'DRAFT' ||
          this.extension.status === 'SUGGESTED' ||
          this.extension.status === 'SUBMITTED'));
  }

  get isSuperUser() {

    return this.userService.user.superuser;
  }

  get restricted() {

    if (this.isSuperUser) {
      return false;
    }
    return this.extension.restricted;
  }

  delete() {

    this.confirmationModalService.openRemoveMember()
      .then(() => {
        this.dataService.deleteMember(this.member).subscribe(res => {
          this.router.navigate(this.member.extension.route);
        }, error => {
          this.errorModalService.openSubmitError(error);
        });
      }, ignoreModalClose);
  }

  cancelEditing(): void {

    this.editableService.cancel();
  }

  findIdFromMembersForValueType(valueType: ValueType): MemberValue | null {
    let memberValue: MemberValue | null = null;
    this.member.memberValues.forEach(mv => {
      if (mv.valueType.localName === valueType.localName) {
        memberValue = mv;
      }
    });
    return memberValue;
  }

  save(formData: any): Observable<any> {

    // TODO: Refactor this hacking so that memberValues are handled dynamically as a list in a dedicated formControl and component.

    const { validity, unaryOperator, comparisonOperator, ...rest } = formData;
    const updatedMember = this.member.clone();

    const updatedUnaryOperator = unaryOperator;
    const unaryValueType = this.extension.propertyType.valueTypeForLocalName('unaryOperator');
    const updatedComparisonOperator = comparisonOperator;
    const comparisonValueType = this.extension.propertyType.valueTypeForLocalName('comparisonOperator');

    const updatedMemberValues: MemberValue[] = [];

    if (updatedUnaryOperator && unaryValueType) {
      const data: MemberValueType = <MemberValueType> {
        value: updatedUnaryOperator,
        valueType: unaryValueType
      };
      const existingMemberValue = this.findIdFromMembersForValueType(unaryValueType);
      if (existingMemberValue) {
      }
      if (existingMemberValue) {
        data.id = existingMemberValue.id;
      }
      const unaryOperatorMemberValue: MemberValue = new MemberValue(data);
      updatedMemberValues.push(unaryOperatorMemberValue);
    }

    if (updatedComparisonOperator && comparisonValueType) {
      const data: MemberValueType = <MemberValueType> {
        value: updatedComparisonOperator,
        valueType: comparisonValueType
      };
      const existingMemberValue = this.findIdFromMembersForValueType(comparisonValueType);
      if (existingMemberValue) {
      }
      if (existingMemberValue) {
        data.id = existingMemberValue.id;
      }
      const comparisonOperatorMemberValue: MemberValue = new MemberValue(data);
      updatedMemberValues.push(comparisonOperatorMemberValue);
    }

    updatedMember.memberValues = updatedMemberValues;

    Object.assign(updatedMember, {
      ...rest,
      startDate: validity.start,
      endDate: validity.end
    });

    return this.dataService.saveMember(updatedMember.serialize()).pipe(tap(() => this.ngOnInit()));
  }
}
