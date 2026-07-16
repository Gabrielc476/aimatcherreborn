// src/domain/services/job-events.service.ts
import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface JobEventPayload {
  jobId: string;
  data: any;
}

@Injectable()
export class JobEventsService {
  private readonly subject = new Subject<JobEventPayload>();

  emit(jobId: string, data: any): void {
    this.subject.next({ jobId, data });
  }

  on(jobId: string): Observable<any> {
    return this.subject.asObservable().pipe(
      filter((event) => event.jobId === jobId),
      map((event) => event.data),
    );
  }
}
