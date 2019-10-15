import { Localizable, Localizer } from 'yti-common-ui/types/localization';
import { ConceptType } from '../services/api-schema';
import { labelNameToResourceIdIdentifier } from 'yti-common-ui/utils/resource';

export class Concept {

  id: string;
  uri: string;
  containerUri: string;
  definition: Localizable;
  prefLabel: Localizable;
  vocabularyPrefLabel: Localizable;
  status: string;

  constructor(data: ConceptType) {
    this.uri = data.uri;
    this.id = data.id;
    this.containerUri = data.containerUrl;
    this.definition = data.definition;
    this.prefLabel = data.prefLabel;
    this.vocabularyPrefLabel = data.vocabularyPrefLabel;
    this.status = data.status;
  }

  getIdIdentifier(localizer: Localizer): string {
    const vocabularyPrefLabel = localizer.translate(this.vocabularyPrefLabel);
    const prefLabel = localizer.translate(this.prefLabel);
    return `${labelNameToResourceIdIdentifier(vocabularyPrefLabel)}_${labelNameToResourceIdIdentifier(prefLabel)}`;
  }

  serialize(): ConceptType {
    return {
      id: this.id,
      containerUrl: this.containerUri,
      prefLabel: this.prefLabel,
      vocabularyPrefLabel: this.vocabularyPrefLabel,
      definition: this.definition,
      uri: this.uri,
      status: this.status
    };
  }
}
