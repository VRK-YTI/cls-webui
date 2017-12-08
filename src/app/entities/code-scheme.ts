import { AbstractResource } from './abstract-resource';
import { Localizable } from 'yti-common-ui/types/localization';
import { Location } from 'yti-common-ui/types/location';
import { CodeRegistry } from './code-registry';
import { formatDate } from '../utils/date';
import { ExternalReference } from './external-reference';
import { DataClassification } from './data-classification';
import { EditableEntity } from './editable-entity';

export class CodeScheme extends AbstractResource implements EditableEntity {

  version: string;
  source: string;
  status: string;
  legalBase: string;
  governancePolicy: string;
  license: string;
  startDate: string;
  endDate: string;
  codeRegistry: CodeRegistry;
  description: Localizable;
  changeNote: Localizable;
  definition: Localizable;
  dataClassifications: DataClassification[];
  externalReferences: ExternalReference[];

  get validity(): string {
    return `${formatDate(this.startDate)} - ${formatDate(this.endDate)}`;
  }

  get modifiedDisplayValue(): string {
    return formatDate(this.modified);
  }

  get route(): any[] {
    return [
      'codescheme',
      {
        codeRegistryCodeValue: this.codeRegistry.codeValue,
        codeSchemeId: this.id
      }
    ];
  }

  get location(): Location[] {
    return [{
      localizationKey: 'Code scheme',
      label: this.prefLabel,
      route: this.route
    }];
  }

  getOwningOrganizationIds(): string[] {
    return this.codeRegistry.organizations.map(org => org.id);
  }
}
