import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { CodeScheme } from '../entities/code-scheme';
import { CodeRegistry } from '../entities/code-registry';
import { Observable } from 'rxjs/Observable';
import { DataClassification } from '../entities/data-classification';
import { Code } from '../entities/code';
import {
  CodeType, ApiResponseType, BaseResourceType, CodeSchemeType, DataClassificationType,
  CodeRegistryType
} from './api-schema';
import { AbstractResource } from '../entities/abstract-resource';

const intakeContext = 'codelist-intake';
const apiContext = 'codelist-api';
const api = 'api';
const version = 'v1';
const registries = 'coderegistries';
const codeSchemes = 'codeschemes';
const codes = 'codes';
const classifications = 'dataclassifications';

const codeSchemesBasePath = `/${apiContext}/${api}/${version}/${codeSchemes}`;
const codeRegistriesBasePath = `/${apiContext}/${api}/${version}/${registries}`;
const codeRegistriesIntakeBasePath = `/${intakeContext}/${api}/${version}/${registries}`;
const dataClassificationsBasePath = `/${intakeContext}/${api}/${version}/${classifications}`;

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
  entity.dataClassifications = scheme.dataClassifications || [];
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

function createDataClassificationEntity(classification: DataClassificationType): DataClassification {

  const entity = new DataClassification();
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
      .map(res => res.json().results as BaseResourceType[]);
  }

  getCodeRegistry(codeRegistryCodeValue: string): Observable<CodeRegistry> {
    return this.http.get(`${codeRegistriesBasePath}/${codeRegistryCodeValue}/`)
      .map(res => createCodeRegistryEntity(res.json()));
  }

  getCodeSchemes(): Observable<CodeScheme[]> {
    return this.http.get(`${codeSchemesBasePath}/?expand=codeRegistry`)
      .map(res => res.json().results.map(createCodeSchemeEntity));
  }

  getCodeSchemesWithTerm(searchTerm: string): Observable<CodeScheme[]> {
    return this.http.get(`${codeSchemesBasePath}/?expand=codeRegistry&prefLabel=${searchTerm}`)
      .map(res => res.json().results.map(createCodeSchemeEntity));
  }

  getDataClassifications(): Observable<DataClassification[]> {
    return this.http.get(`${dataClassificationsBasePath}/`)
      .map(res => res.json().results.map(createDataClassificationEntity));
  }

  getCodeSchemesWithClassification(dataClassification: string): Observable<CodeScheme[]> {
    return this.http.get(`${codeSchemesBasePath}/?expand=codeRegistry&dataClassification=${dataClassification}`)
      .map(res => res.json().results.map(createCodeSchemeEntity));
  }

  getCodeSchemesForRegistry(codeRegistryCodeValue: string): Observable<CodeScheme[]> {
    return this.http.get(`${codeRegistriesBasePath}/${codeRegistryCodeValue}/${codeSchemes}/?expand=codeRegistry`)
      .map(res => res.json().results.map(createCodeSchemeEntity));
  }

  getCodeScheme(registryCode: string, schemeCode: string): Observable<CodeScheme> {
    return this.http.get(`${codeRegistriesBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/?expand=codeRegistry,code`)
      .map(res => createCodeSchemeEntity(res.json()));
  }

  getCodes(codeRegistryCodeValue: string, codeSchemeCodeValue: string): Observable<Code[]> {
    return this.http.get(`${codeRegistriesBasePath}/${codeRegistryCodeValue}/${codeSchemes}/${codeSchemeCodeValue}/${codes}/?expand=codeScheme,codeRegistry`)
      .map(res => res.json().results.map(createCodeEntity));
  }

  getCode(registryCode: string, schemeCode: string, codeId: string): Observable<Code> {
    return this.http.get(`${codeRegistriesBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/${codes}/${codeId}/?expand=codeScheme,codeRegistry`)
      .map(res => createCodeEntity(res.json()));
  }

  saveCode(code: Code): Observable<ApiResponseType> {

    const registryCode = code.codeScheme.codeRegistry.codeValue;
    const schemeCode = code.codeScheme.codeValue;

    return this.http.post(`${codeRegistriesIntakeBasePath}/${registryCode}/${codeSchemes}/${schemeCode}/${codes}/${code.id}/`, code)
      .map(res => res.json() as ApiResponseType);
  }

  saveCodeScheme(codeScheme: CodeScheme): Observable<ApiResponseType> {

    const registryCode = codeScheme.codeRegistry.codeValue;

    return this.http.post(`${codeRegistriesIntakeBasePath}/${registryCode}/${codeSchemes}/${codeScheme.id}/`, codeScheme)
      .map(res => res.json() as ApiResponseType);
  }
}
