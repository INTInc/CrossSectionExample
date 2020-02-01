import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class TemplateService {
    constructor(private http: HttpClient) {

    }
    async getTemplate(file: string) {
        return this.http.get(file).toPromise();
    }
}
