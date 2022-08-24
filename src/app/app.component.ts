import { Component, OnDestroy, OnInit } from '@angular/core';
import { Papa } from 'ngx-papaparse';
import { FileReaderService } from './service/fileReader.service';
import { CsvModel } from './models/csvModel';
import * as xml2js from 'xml2js';
import { Subject, takeUntil } from 'rxjs';
import { FileRules } from './models/fileRule';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  csvFileArray: CsvModel[] = [];
  displayTable = false;
  filteredArr: CsvModel[] = [];
  requiredKeys = ['Reference', 'Account Number', 'Description', 'Start Balance', 'Mutation', 'End Balance']
  checkAllKeys: boolean = false;
  showErroMessage: boolean = false;
  xml2js = require('xml2js');
  fileLength = 0;
  xml: any;
  xmlArr: CsvModel[] = [];
  errorMessage: string = '';
  ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(private papaFileReader: Papa,
    private fileReader: FileReaderService) {}

  ngOnInit(): void {
  }

  /** Read the CSV file and convert it to JS Object
   * Loop through and complete the validation
   * Return the filtered array with failed transactions */
  onHandleCSVFileSelect(fileChangeEvent: Event) {
    const target = fileChangeEvent.target as HTMLInputElement;
    const filesList = target.files as FileList;
    
    this.csvFileArray = [];
    this.filteredArr = [];
    this.displayTable = false;
    this.showErroMessage = false;
    this.fileLength = filesList.length;

    if (this.fileLength !== 0) {
      const files = filesList; // FileList object
      const file = files[0];
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (event: any) => {
        const csv = event.target.result;
        this.papaFileReader.parse(csv, {
          skipEmptyLines: true,
          header: true,
          complete: (results) => {
            if (!!results.data && results.data.length > 0) {
              this.getCsvJsonArray(results);
            } else {
              this.displayTable = false;
              this.showErroMessage = true;
              this.errorMessage = 'Choosen CSV file is empty';
            }
          },
        });
      };
    } else {
      this.displayTable = false;
    }
  }

  getCsvJsonArray(results: any) {
    for (let i = 0; i < results.data.length; i++) {
      this.checkAllKeys = this.requiredKeys.every((key) => results.data[i].hasOwnProperty(key));
      let orderDetails = {
        reference: results.data[i][FileRules.CsvReference],
        accountNum: results.data[i][FileRules.CsvAccountNumber],
        description: results.data[i][FileRules.CsvDescription],
        startBal: results.data[i][FileRules.CsvStartBalance],
        mutation: results.data[i][FileRules.CsvMutation],
        endBal: results.data[i][FileRules.CsvEndBalance]
      };
      this.csvFileArray.push(orderDetails);
    }
    if (this.checkAllKeys) {
      this.displayTable = true;
      this.filteredArr = this.validateData(this.csvFileArray);
    } else {
      this.displayTable = false;
      this.showErroMessage = true;
      this.errorMessage = 'The supplied file does not have the required columns'
    }
  }

  /** Subscribe to the XML file and convert it to JS Object
   * Loop through and complete the validation
   * Return the filtered array with failed transactions */
  onHandleXMLFileSelect() {
    let fileReadArray = [];
    this.filteredArr = [];
    this.displayTable = false;
    this.showErroMessage = false;
    this.xml = {};
    this.xmlArr = [];
    this.fileReader.getXMLInfo()
    .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe({
        next: (resp) => {
          const parser = new xml2js.Parser({ strict: false, trim: true });
          parser.parseString(resp, (error: any, result: any) => {
            if (error) {
              throw new Error(error);
            } else {
              this.xml = result;
            }
          });
          fileReadArray = this.xml.RECORDS.RECORD;
          this.getXmlJsonArray(fileReadArray);
        },
        error: (error) => {
          this.displayTable = false;
          this.showErroMessage = true;
          this.errorMessage = "Invalid Response";
        }
      });
  }

  getXmlJsonArray(fileReadArray: any) {
    for (let i = 0; i < fileReadArray.length; i++) {
      let orderDetails = {
        reference: fileReadArray[i]['$'][FileRules.Reference],
        accountNum: fileReadArray[i][FileRules.AccountNumber].toString(),
        description: fileReadArray[i][FileRules.Description].toString(),
        startBal: fileReadArray[i][FileRules.StartBalance].toString(),
        mutation: fileReadArray[i][FileRules.Mutation].toString(),
        endBal: fileReadArray[i][FileRules.EndBalance].toString()
      };
      this.xmlArr.push(orderDetails);
    }
    this.displayTable = true;
    this.filteredArr = this.validateData(this.xmlArr);
  }

  /** Validation method */
  validateData(data: any) {
    let returnedArr = data.filter((val: any, index: number) => {
      return (this.isReferenceNotUnique(data, val, index) || this.isEndBalanceNotCorrect(val))
    })
    return returnedArr;

  }
  
  /** Checks for non unique reference  */
  isReferenceNotUnique(array: any, val: any, index: number) {
    let checkRef = false;
    for (let i = 0; i < array.length; i++) {
      if (array[i].reference === val.reference && i !== index) {
        checkRef = true;
        break;
      }
    }
    return checkRef;
  }

  /** Checks for incorrect end balance */
  isEndBalanceNotCorrect(val: any) {
    if (parseFloat(((+val.startBal) + (+val.mutation)).toFixed(2)) !== parseFloat(val.endBal)) {
      return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    }
}
