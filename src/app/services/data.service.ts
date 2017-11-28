import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { CodeScheme } from '../entities/code-scheme';
import { CodeRegistry } from '../entities/code-registry';
import { Observable } from 'rxjs/Observable';
import { DataClassification } from '../entities/data-classification';
import { Code } from '../entities/code';
import {
  CodeType, ApiResponseType, BaseResourceType, CodeSchemeType, DataClassificationType,
  CodeRegistryType, PropertyTypeType, ExternalReferenceType, OrganizationType
} from './api-schema';
import { AbstractResource } from '../entities/abstract-resource';
import { PropertyType } from '../entities/property-type';
import { ExternalReference } from '../entities/external-reference';
import { environment } from '../../environments/environment';
import { Organization } from '../entities/organization';

const intakeContext = 'codelist-intake';
const apiContext = 'codelist-api';
const api = 'api';
const publicApi = 'public-api';

const version = 'v1';
const registries = 'coderegistries';
const codeSchemes = 'codeschemes';
const codes = 'codes';
const externalReferences = 'externalreferences';
const classifications = 'dataclassifications';
const propertytypes = 'propertytypes';
const organizations = 'organizations';
const rhpBasePath = environment.rhpUrl;

const codeSchemesBasePath = `/${apiContext}/${api}/${version}/${codeSchemes}`;
const codeRegistriesBasePath = `/${apiContext}/${api}/${version}/${registries}`;
const externalReferencesBasePath = `/${apiContext}/${api}/${version}/${externalReferences}`;
const codeRegistriesIntakeBasePath = `/${intakeContext}/${api}/${version}/${registries}`;
const dataClassificationsBasePath = `/${intakeContext}/${api}/${version}/${classifications}`;
const propertyTypesBasePath = `/${apiContext}/${api}/${version}/${propertytypes}`;
const organizationsBasePath = `${rhpBasePath}/${publicApi}/${organizations}`;

function setBaseValues(entity: AbstractResource, type: BaseResourceType) {
  entity.id = type.id;
  entity.uri = type.uri;
  entity.codeValue = type.codeValue;
  entity.modified = type.modified;
  entity.prefLabels = type.prefLabels || {};
}

function createCodeRegistryEntity(registry: CodeRegistryType): CodeRegistry {

  const entity = new CodeRegistry();
  setBaseValues(entity, registry);
  entity.codeSchemes = registry.codeSchemes;
  return entity;
}

function createOrganizationEntity(organization: OrganizationType): Organization {
  
  const entity = new Organization();
  entity.uuid = organization.uuid;
  entity.prefLabel = organization.prefLabel || {};
  entity.description = organization.description || {};
  entity.url = organization.url;
  return entity;
}

function createExternalReferenceEntity(externalReference: ExternalReferenceType): ExternalReference {

  const entity = new ExternalReference();
  entity.id = externalReference.id;
  entity.titles = externalReference.titles || {};
  entity.descriptions = externalReference.descriptions || {};
  entity.uri = externalReference.uri;
  entity.url = externalReference.url;
  entity.propertyType = createPropertyTypeEntity(externalReference.propertyType);
  return entity;
}

function createCodeSchemeEntity(scheme: CodeSchemeType): CodeScheme {

  const entity = new CodeScheme();
  setBaseValues(entity, scheme);
  entity.version = scheme.version;
  entity.source = scheme.source;
  entity.status = scheme.status;
  entity.legalBase = scheme.legalBase;
  entity.governancePolicy = scheme.governancePolicy;
  entity.license = scheme.license;
  entity.startDate = scheme.startDate;
  entity.endDate = scheme.endDate;
  entity.codeRegistry = createCodeRegistryEntity(scheme.codeRegistry);
  entity.descriptions = scheme.descriptions || {};
  entity.changeNotes = scheme.changeNotes || {};
  entity.definitions = scheme.definitions || {};
  entity.dataClassifications = (scheme.dataClassifications || []).map(createDataClassificationEntity);
  entity.externalReferences = (scheme.externalReferences || []).map(createExternalReferenceEntity);
  return entity;
}

function createCodeEntity(code: CodeType): Code {

  const entity = new Code();
  setBaseValues(entity, code);
  entity.codeScheme = createCodeSchemeEntity(code.codeScheme);
  entity.shortName = code.shortName;
  entity.status = code.status;
  entity.startDate = code.startDate;
  entity.endDate = code.endDate;
  entity.descriptions = code.descriptions || {};
  entity.definitions = code.definitions || {};
  return entity;
}

function createPropertyTypeEntity(propertyType: PropertyTypeType): PropertyType {

  const entity = new PropertyType();
  entity.id = propertyType.id;
  entity.prefLabels = propertyType.prefLabels || {};
  entity.definitions = propertyType.definitions || {};
  entity.uri = propertyType.uri;
  entity.propertyUri = propertyType.propertyUri;
  entity.context = propertyType.context;
  entity.localName = propertyType.localName;
  entity.type = propertyType.type;
  return entity;
}

function createDataClassificationEntity(classification: DataClassificationType): DataClassification {

  const entity = new DataClassification();
  entity.id = classification.id;
  entity.uri = classification.uri;
  entity.status = classification.status;
  entity.modified = classification.modified;
  entity.codeValue = classification.codeValue;
  entity.prefLabels = classification.prefLabels || {};
  entity.codeScheme = classification.codeScheme;
  entity.count = classification.count;
  return entity;
}

@Injectable()
export class DataService {

  constructor(private http: Http) {
  }

  getCodeRegistries(): Observable<CodeRegistry[]> {
    return this.http.get(codeRegistriesBasePath)
      .map(res => res.json().results.map(createCodeRegistryEntity));
  }

  getOrganizations(): Observable<Organization[]> {
    return this.http.get(organizationsBasePath)
      .map(res => res.json().map(createOrganizationEntity));
  } 

  getCodeRegistry(codeRegistryCodeValue: string): Observable<CodeRegistry> {
    return this.http.get(`${codeRegistriesBasePath}/${codeRegistryCodeValue}/`)
      .map(res => createCodeRegistryEntity(res.json()));
  }

  searchCodeSchemes(searchTerm: string, classification: string|null): Observable<CodeScheme[]> {

    const params = new URLSearchParams();
    params.append('expand', 'codeRegistry,externalReference,propertyType,code');

    if (searchTerm) {
      params.append('prefLabel', searchTerm);
    }

    if (classification) {
      params.append('dataClassification', classification);
    }

    return this.http.get(`${codeSchemesBasePath}`, { params })
      .map(res => res.json().results.map(createCodeSchemeEntity));
  }

  getPropertyTypes(context: string): Observable<PropertyType[]> {

    const params = new URLSearchParams();
    params.append('context', context);

    return this.http.get(`${propertyTypesBasePath}/`, { params })
      .map(res => res.json().results.map(createPropertyTypeEntity));
  }

  getDataClassifications(): Observable<DataClassification[]> {
    return this.http.get(`${dataClassificationsBasePath}/`)
      .map(res => res.json().results.map(createDataClassificationEntity));
  }

  getCodeScheme(registryCode: string, schemeCode: string): Observable<CodeScheme> {

    const params = new URLSearchParams();
    params.append('expand', 'codeRegistry,code,externalReference,propertyType,code');

    return this.http.get(`${codeRegistriesBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/`, { params })
      .map(res => createCodeSchemeEntity(res.json()));
  }

  getExternalReferences(codeSchemeId: string): Observable<ExternalReference[]> {

    const params = new URLSearchParams();
    params.append('codeSchemeId', codeSchemeId);
    params.append('expand', 'propertyType');

    // FIXME why results can be undefined?
    return this.http.get(`${externalReferencesBasePath}/`, { params })
      .map(res => (res.json().results || []).map(createExternalReferenceEntity));
  }

  getCodes(registryCode: string, schemeCode: string): Observable<Code[]> {

    const params = new URLSearchParams();
    params.append('expand', 'codeScheme,codeRegistry');

    return this.http.get(`${codeRegistriesBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/${codes}/`, { params })
      .map(res => res.json().results.map(createCodeEntity));
  }

  getCode(registryCode: string, schemeCode: string, codeId: string): Observable<Code> {

    const params = new URLSearchParams();
    params.append('expand', 'codeScheme,codeRegistry');

    return this.http.get(`${codeRegistriesBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/${codes}/${codeId}/`, { params })
      .map(res => createCodeEntity(res.json()));
  }

  saveCode(code: CodeType): Observable<ApiResponseType> {

    const registryCode = code.codeScheme.codeRegistry.codeValue;
    const schemeCode = code.codeScheme.codeValue;

    return this.http.post(`${codeRegistriesIntakeBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/${codes}/${code.id}/`, code)
      .map(res => res.json() as ApiResponseType);
  }

  saveCodeScheme(codeScheme: CodeSchemeType): Observable<ApiResponseType> {

    const registryCode = codeScheme.codeRegistry.codeValue;

    return this.http.post(`${codeRegistriesIntakeBasePath}/${registryCode}/${codeSchemes}/${codeScheme.id}/`, codeScheme)
      .map(res => res.json() as ApiResponseType);
  }
}
