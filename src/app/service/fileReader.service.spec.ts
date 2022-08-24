import { HttpClient, HttpClientModule } from "@angular/common/http";
import { fakeAsync, inject, TestBed, tick } from "@angular/core/testing"
import { RouterTestingModule} from "@angular/router/testing";
import { FileReaderService } from "./fileReader.service";
import {  of } from 'rxjs';

describe('FileReaderService', () => {
    let service: FileReaderService;
    let mockHttpClient : HttpClient;

    beforeEach(() => {
        service = new FileReaderService(mockHttpClient)
        TestBed.configureTestingModule({
            imports: [
                RouterTestingModule,
                HttpClientModule
              ],
            providers: [FileReaderService]
        });
    });

    it('should be created', inject([FileReaderService],(service: FileReaderService) => {
        expect(service).toBeTruthy();
    }))

    it('should return a record', () => {   
        let xmlResponse = `<records>\n  <record reference="164702">\n    <accountNumber>NL46ABNA0625805417</accountNumber>\n    <description>Flowers for Rik Dekker</description>\n    <startBalance>81.89</startBalance>\n    <mutation>+5.99</mutation>\n    <endBalance>8.88</endBalance>\n  </record>\n</records>`
        let response = '';
        spyOn(service, 'getXMLInfo').and.returnValue(of(xmlResponse));
         service.getXMLInfo().subscribe((res: any)=> {
             response = res;
         })
         expect(response).toEqual(xmlResponse);
    })
})