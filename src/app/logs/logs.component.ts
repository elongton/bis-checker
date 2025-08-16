import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  logs: any[] = [];
  totalLogs = 0;
  page = 1;
  limit = 10;
  startDate = '';
  endDate = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchLogs();
  }

  fetchLogs(): void {
    const params: any = { page: this.page, limit: this.limit };
    if (this.startDate) params.start = this.startDate;
    if (this.endDate) params.end = this.endDate;

    this.http.get<any>('/api/gear/logs', { params }).subscribe(data => {
      this.logs = data.logs;
      this.totalLogs = data.total;
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.fetchLogs();
  }

  applyDateFilter(): void {
    this.page = 1;
    this.fetchLogs();
  }
}
