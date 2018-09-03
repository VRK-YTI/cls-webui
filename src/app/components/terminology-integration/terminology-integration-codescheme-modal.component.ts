import {
  Component,
  ElementRef,
  Injectable,
  ViewChild,
  Input, AfterViewInit
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../services/data.service';
import { Vocabulary } from '../../entities/vocabulary';
import { LanguageService } from '../../services/language.service';
import { ModalService} from '../../services/modal.service';
import { OnInit } from '@angular/core';
import { FilterOptions } from 'yti-common-ui/components/filter-dropdown.component';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject, concat, combineLatest } from 'rxjs';
import { debounceTime, skip, take } from 'rxjs/operators';
import { Concept } from '../../entities/concept';
import { CodeListErrorModalService } from '../common/error-modal.service';

function debounceSearch(search$: Observable<string>): Observable<string> {
  const initialSearch = search$.pipe(take(1));
  const debouncedSearch = search$.pipe(skip(1), debounceTime(500));
  return concat(initialSearch, debouncedSearch);
}

@Injectable()
export class TerminologyIntegrationModalService {

  constructor(private modalService: ModalService) {
  }

  public open(updatingExistingEntity: boolean, targetEntityKind: string): Promise<Concept> {
    const modalRef = this.modalService.open(TerminologyIntegrationCodeschemeModalComponent, {size: 'lg'});
    const instance = modalRef.componentInstance as TerminologyIntegrationCodeschemeModalComponent;
    instance.updatingExistingEntity = updatingExistingEntity;
    instance.targetEntityKind = targetEntityKind;
    return modalRef.result;
  }
}

@Component({
  selector: 'app-terminology-integration-codescheme-modal',
  templateUrl: './terminology-integration-codescheme-modal.component.html',
  styleUrls: ['./terminology-integration-codescheme-modal.component.scss']
})
export class TerminologyIntegrationCodeschemeModalComponent implements OnInit, AfterViewInit {

  @Input() updatingExistingEntity = true;
  @Input() targetEntityKind: string; // code or codescheme

  vocabularyOptions: FilterOptions<Vocabulary>;
  vocabulary$ = new BehaviorSubject<Vocabulary|null>(null);
  loading = false;

  @ViewChild('searchInput') searchInput: ElementRef;

  searchResults: Concept[];
  search$ = new BehaviorSubject('');
  debouncedSearch$ = debounceSearch(this.search$);
  cancelText: string;
  terminologyIntegrationModalPageTitle: string;
  terminologyIntegrationModalInstructionText: string;

  constructor(private dataService: DataService,
              private modal: NgbActiveModal,
              public languageService: LanguageService,
              private translateService: TranslateService,
              private codeListErrorModalService: CodeListErrorModalService) {
  }

  ngOnInit() {
    combineLatest(this.vocabulary$, this.debouncedSearch$)
      .subscribe(([vocabulary, search]) => {

        if (!search) {
          this.searchResults = [];
        } else {
          this.loading = true;
          this.dataService.getConcepts(search, vocabulary ? vocabulary.id : null).subscribe(concepts => {
              this.loading = false;
              this.searchResults = concepts;
            },
            err => {
              this.loading = false;
              this.codeListErrorModalService.openSubmitError(err);
            });
        }
      });

    this.dataService.getVocabularies().subscribe(vocabularies => {
      this.vocabularyOptions = [null, ...vocabularies].map(voc => ({
        value: voc,
        name: () => voc ? this.languageService.translate(voc.prefLabel, true)
          : this.translateService.instant('All vocabularies'),
        idIdentifier: () => voc ? voc.getIdIdentifier(this.languageService, true)
          : 'all_selected'
      })
      );

    }, error => {
      this.vocabularyOptions = [
        { value: null, name: () => this.translateService.instant('All vocabularies')}];
      this.codeListErrorModalService.openSubmitError(error);
    });

    if (this.targetEntityKind === 'code') {
      if (!this.updatingExistingEntity) {
        this.cancelText = 'cancelTextForCodeCreation';
        this.terminologyIntegrationModalPageTitle = 'terminologyIntegrationModalPageTitleWhenCreatingCode';
      } else {
        this.cancelText = 'Cancel';
        this.terminologyIntegrationModalPageTitle = 'Get concept from Controlled Vocabularies';
      }
      this.terminologyIntegrationModalInstructionText = 'terminologyIntegrationModalInstructionTextWhenCreatingCode';
    } else if (this.targetEntityKind === 'codescheme') {
      if (!this.updatingExistingEntity) {
        this.cancelText = 'cancelTextForCodeSchemeCreation';
        this.terminologyIntegrationModalPageTitle = 'terminologyIntegrationModalPageTitleWhenCreatingCodeScheme';
      } else {
        this.cancelText = 'Cancel';
        this.terminologyIntegrationModalPageTitle = 'Get concept from Controlled Vocabularies';
      }
      this.terminologyIntegrationModalInstructionText = 'terminologyIntegrationModalInstructionTextWhenCreatingCodeScheme';
    }
  }

  ngAfterViewInit() {
    this.searchInput.nativeElement.focus();
  }

  hasSearchResults() {
    return this.searchResults.length > 0;
  }

  close() {
    this.modal.dismiss('cancel');
  }

  select(concept: Concept) {
    this.modal.close(concept);
  }

  get search() {
    return this.search$.getValue();
  }

  set search(value: string) {
    this.search$.next(value);
  }

  cancel() {
    this.modal.dismiss('cancel');
  }
}
