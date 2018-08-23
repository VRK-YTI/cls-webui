import { AbstractResource } from './abstract-resource';
import { Localizable } from 'yti-common-ui/types/localization';
import { Location } from 'yti-common-ui/types/location';
import { CodeRegistry } from './code-registry';
import { formatDate, formatDateTime, formatDisplayDateTime, parseDate, parseDateTime } from '../utils/date';
import { ExternalReference } from './external-reference';
import { EditableEntity } from './editable-entity';
import { restrictedStatuses, Status } from 'yti-common-ui/entities/status';
import { Moment } from 'moment';
import {CodeSchemeType} from '../services/api-schema';
import { contains } from 'yti-common-ui/utils/array';
import { hasLocalization } from 'yti-common-ui/utils/localization';
import { CodePlain } from './code-simple';
import { ExtensionSchemeSimple } from './extension-scheme-simple';
import {CodeSchemeListItem} from './code-scheme-list-item';

export class CodeScheme extends AbstractResource implements EditableEntity {

  version: string;
  source: string;
  status: Status = 'DRAFT';
  legalBase: string;
  governancePolicy: string;
  startDate: Moment|null = null;
  endDate: Moment|null = null;
  codeRegistry: CodeRegistry;
  description: Localizable = {};
  changeNote: Localizable = {};
  definition: Localizable = {};
  dataClassifications: CodePlain[] = [];
  externalReferences: ExternalReference[] = [];
  conceptUriInVocabularies: string;
  modified: Moment|null = null;
  defaultCode: CodePlain|null = null;
  extensionSchemes: ExtensionSchemeSimple[] = [];
  motherOfThisVariant: CodeSchemeListItem|null = null;
  variantsOfThisCodeScheme: CodeSchemeListItem[] = [];
  variantCodeschemeId: string|null = null; // these IDs have to flow thru the UI as well, otherwise dataloss ensues
  nextCodeschemeId: string|null = null;
  prevCodeschemeId: string|null = null;
  lastCodeschemeId: string|null = null;
  allVersions: CodeSchemeListItem[] = [];

  constructor(data: CodeSchemeType) {
    super(data);

    if (data.modified) {
      this.modified = parseDateTime(data.modified);
    }
    this.version = data.version;
    this.source = data.source;
    if (data.status) {
      this.status = data.status;
    }
    this.legalBase = data.legalBase;
    this.governancePolicy = data.governancePolicy;
    if (data.startDate) {
      this.startDate = parseDate(data.startDate);
    }
    if (data.endDate) {
      this.endDate = parseDate(data.endDate);
    }
    this.codeRegistry = new CodeRegistry(data.codeRegistry);
    this.description = data.description || {};
    this.changeNote = data.changeNote || {};
    this.definition = data.definition || {};
    this.dataClassifications = (data.dataClassifications || []).map(dc => new CodePlain(dc));
    this.externalReferences = (data.externalReferences || []).map(er => new ExternalReference(er));
    this.extensionSchemes = (data.extensionSchemes || []).map(es => new ExtensionSchemeSimple(es));
    this.conceptUriInVocabularies = data.conceptUriInVocabularies;
    if (data.defaultCode) {
      this.defaultCode = new CodePlain(data.defaultCode);
    }
    if (data.motherOfThisVariant) {
      this.motherOfThisVariant = new CodeSchemeListItem(data.motherOfThisVariant);
    }
    if (data.variantsOfThisCodeScheme) {
      this.variantsOfThisCodeScheme = (data.variantsOfThisCodeScheme || []).map(variant => new CodeSchemeListItem(variant));
    }
    if (data.allVersions) {
      this.allVersions = (data.allVersions || []).map(version => new CodeSchemeListItem(version));
    }
    if (data.variantCodeschemeId) {
      this.variantCodeschemeId = data.variantCodeschemeId;
    }
    if (data.nextCodeschemeId) {
      this.nextCodeschemeId = data.nextCodeschemeId;
    }
    if (data.prevCodeschemeId) {
      this.prevCodeschemeId = data.prevCodeschemeId;
    }
    if (data.lastCodeschemeId) {
      this.lastCodeschemeId = data.lastCodeschemeId;
    }
  }

  get modifiedDisplayValue(): string {
    return formatDisplayDateTime(this.modified);
  }

  get route(): any[] {
    return [
      'codescheme',
      {
        registryCode: this.codeRegistry.codeValue,
        schemeCode: this.codeValue
      }
    ];
  }

  get location(): Location[] {
    return [
      ...this.codeRegistry.location,
      {
        localizationKey: 'Code list',
        label: this.prefLabel,
        value: !hasLocalization(this.prefLabel) ? this.codeValue : '',
        route: this.route
      }
    ];
  }

  get restricted() {
    return contains(restrictedStatuses, this.status);
  }

  get idIdentifier(): string {
    return `${this.codeRegistry.codeValue}_${this.codeValue}`;
  }

  getOwningOrganizationIds(): string[] {
    return this.codeRegistry.organizations.map(org => org.id);
  }

  allowOrganizationEdit(): boolean {
    return true;
  }

  isInDeletableState() {
    return contains(['INCOMPLETE', 'DRAFT', 'SUGGESTED', 'SUBMITTED'], this.status);
  }

  serialize(): CodeSchemeType {
    return {
      id: this.id,
      uri: this.uri,
      url: this.url,
      codeValue: this.codeValue,
      modified: formatDateTime(this.modified),
      prefLabel: { ...this.prefLabel },
      version: this.version,
      source: this.source,
      status: this.status,
      legalBase: this.legalBase,
      governancePolicy: this.governancePolicy,
      startDate: formatDate(this.startDate),
      endDate: formatDate(this.endDate),
      codeRegistry: this.codeRegistry.serialize(),
      description: { ...this.description },
      changeNote: { ...this.changeNote },
      definition: { ...this.definition },
      dataClassifications: this.dataClassifications.map(dc => dc.serialize()),
      externalReferences: this.externalReferences.map(er => er.serialize()),
      extensionSchemes: this.extensionSchemes.map(es => es.serialize()),
      conceptUriInVocabularies: this.conceptUriInVocabularies,
      defaultCode: this.defaultCode ? this.defaultCode.serialize() : undefined,
      variantCodeschemeId: this.variantCodeschemeId,
      nextCodeschemeId: this.nextCodeschemeId,
      prevCodeschemeId: this.prevCodeschemeId,
      lastCodeschemeId: this.lastCodeschemeId,
      allVersions: this.allVersions.map(li => li.serialize())
    };
  }

  clone(): CodeScheme {
    return new CodeScheme(this.serialize());
  }
}
