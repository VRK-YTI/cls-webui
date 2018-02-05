import { Localizable } from 'yti-common-ui/types/localization';
import { Location } from 'yti-common-ui/types/location';
import { AbstractResource } from './abstract-resource';
import { CodeScheme } from './code-scheme';
import { formatDate, formatDateTime, formatDisplayDate, formatDisplayDateTime, parseDate } from '../utils/date';
import { EditableEntity } from './editable-entity';
import { ExternalReference } from './external-reference';
import { Status } from 'yti-common-ui/entities/status';
import { Moment } from 'moment';
import { CodeType } from '../services/api-schema';

export class Code extends AbstractResource implements EditableEntity {

  codeScheme: CodeScheme;
  shortName: string;
  status: Status = 'DRAFT';
  startDate: Moment|null = null;
  endDate: Moment|null = null;
  description: Localizable = {};
  definition: Localizable = {};
  externalReferences: ExternalReference[] = [];

  constructor(data: CodeType) {
    super(data);

    this.codeScheme = new CodeScheme(data.codeScheme);
    this.shortName = data.shortName;
    if (data.status) {
      this.status = data.status;
    }
    if (data.startDate) {
      this.startDate = parseDate(data.startDate);
    }
    if (data.endDate) {
      this.endDate = parseDate(data.endDate);
    }
    this.description = data.description || {};
    this.definition = data.definition || {};
    this.externalReferences = (data.externalReferences || []).map(er => new ExternalReference(er));
  }

  get registryCode() {
    return this.codeScheme.codeRegistry.codeValue;
  }

  get schemeId() {
    return this.codeScheme.id;
  }

  get validity(): string {
    return `${formatDisplayDate(this.startDate)} - ${formatDisplayDate(this.endDate)}`;
  }

  get modifiedDisplayValue(): string {
    return formatDisplayDateTime(this.modified);
  }

  get route(): any[] {
    return [
      'code',
      {
        codeRegistryCodeValue: this.registryCode,
        codeSchemeId: this.schemeId,
        codeId: this.id
      }
    ];
  }

  get location(): Location[] {
    return [
      ...this.codeScheme.location,
      {
        localizationKey: 'Code',
        label: this.prefLabel,
        route: this.route
      }
    ];
  }

  getOwningOrganizationIds(): string[] {
    return this.codeScheme.codeRegistry.organizations.map(org => org.id);
  }

  serialize(): CodeType {
    return {
      id: this.id,
      uri: this.uri,
      codeValue: this.codeValue,
      modified: formatDateTime(this.modified),
      prefLabel: { ...this.prefLabel },
      codeScheme: this.codeScheme.serialize(),
      shortName: this.shortName,
      status: this.status,
      startDate: formatDate(this.startDate),
      endDate: formatDate(this.endDate),
      description: { ...this.description },
      definition: { ...this.definition },
      externalReferences: this.externalReferences.map(er => er.serialize())
    };
  }

  clone(): Code {
    return new Code(this.serialize());
  }
}
