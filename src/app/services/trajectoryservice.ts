import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable()
export class TrajectoryService {
    constructor(private http: HttpClient) {

    }
    async getTrajectory(file: string) {
        return this.http.get(file).toPromise();
    }
}
