import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { EditableService } from '../../services/editable.service';
import { LanguageService } from '../../services/language.service';
import { validDateRange } from '../../utils/date';
import { UserService } from 'yti-common-ui/services/user.service';
import { DataService } from '../../services/data.service';
import { ActivatedRoute } from '@angular/router';
import { Extension } from '../../entities/extension';
import { LocationService } from '../../services/location.service';
import { CodeScheme } from '../../entities/code-scheme';

@Component({
  selector: 'app-extension-information',
  templateUrl: './extension-information.component.html',
  styleUrls: ['./extension-information.component.scss']
})
export class ExtensionInformationComponent implements OnChanges, OnDestroy, OnInit {

  @Input() extension: Extension;

  codeSchemes: CodeScheme[];
  env: string;

  extensionForm = new FormGroup({
    prefLabel: new FormControl({}),
    codeSchemes: new FormControl([]),
    validity: new FormControl(null, validDateRange),
    status: new FormControl()
  });

  cancelSubscription: Subscription;

  constructor(private userService: UserService,
              private dataService: DataService,
              private route: ActivatedRoute,
              private locationService: LocationService,
              private editableService: EditableService,
              public languageService: LanguageService) {

    this.cancelSubscription = editableService.cancel$.subscribe(() => this.reset());

    this.dataService.getServiceConfiguration().subscribe(configuration => {
      this.env = configuration.env;
    });
  }

  ngOnInit() {
    if (!this.extension) {
      const registryCodeValue = this.route.snapshot.params.registryCode;
      const schemeCodeValue = this.route.snapshot.params.schemeCode;
      const extensionCodeValue = this.route.snapshot.params.extensionCode;

      if (!registryCodeValue || !schemeCodeValue || !extensionCodeValue) {
        throw new Error(
          `Illegal route, registry: '${registryCodeValue}', scheme: '${schemeCodeValue}', extension: '${extensionCodeValue}`);
      }

      this.dataService.getExtension(registryCodeValue, schemeCodeValue, extensionCodeValue).subscribe(extension => {
        this.extension = extension;
        this.locationService.atExtensionPage(extension);
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.reset();
  }

  private reset() {
    const { startDate, endDate, ...rest } = this.extension;

    this.extensionForm.reset({
      ...rest,
      validity: { start: startDate, end: endDate }
    });
  }

  ngOnDestroy() {
    this.cancelSubscription.unsubscribe();
  }

  get editing() {
    return this.editableService.editing;
  }

  get isSuperUser() {
    return this.userService.user.superuser;
  }

  get restricted(): boolean {
    if (this.isSuperUser) {
      return false;
    }
    return this.extension.restricted;
  }

  get loading(): boolean {
    return this.extension == null || this.env == null;
  }

  getExtensionUri() {
    if (this.env !== 'prod') {
      return this.extension.uri + '?env=' + this.env;
    }
    return this.extension.uri;
  }
}
