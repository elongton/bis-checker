import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface ItemResult { id: number; name: string; }

@Injectable({ providedIn: 'root' })
export class BlizzardService {
  constructor(private http: HttpClient) {}

  // Keep for optional future UI
  searchItems(term: string, limit = 5): Observable<ItemResult[]> {
    const q = term.trim();
    if (!q) return of([] as ItemResult[]);
    return this.http.get<ItemResult[]>(`/api/blizzard/item-search`, { params: { q, limit } });
  }

  getItem(id: number): Observable<ItemResult> {
    return this.http.get<ItemResult>(`/api/blizzard/item/${id}`);
  }
}
