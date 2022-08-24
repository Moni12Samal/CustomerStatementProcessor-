import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, throwError } from "rxjs";

@Injectable({
    providedIn: 'root'
})

export class FileReaderService {
    url="assets/records.xml"
  
  constructor(private http:HttpClient) { }

    getXMLInfo(){
        return this.http.get(this.url, {
            headers: new HttpHeaders({
                'content-type': 'application/xml'
            }),
            responseType:'text'
        }).pipe(
            catchError(error => {
                throw new Error(error)
            })
        );
    }
}